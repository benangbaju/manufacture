# PRD: Aplikasi Cash Flow, Manufaktur & Inventory Tracking

**Versi:** 1.1 (Draft)
**Status:** Internal use only — single user/tanpa role
**Stack:** Next.js + Supabase (free tier)

---

## 1. Latar Belakang & Tujuan

Bisnis manufaktur baju (bahan baku → produksi → jual online/offline) saat ini belum punya sistem tersentralisasi untuk:
- Mencatat pembelian bahan baku dan stoknya
- Mencatat pemakaian bahan baku saat produksi
- Menghitung harga pokok produksi (HPP) per batch
- Mencatat penjualan dari berbagai channel (Shopee, TikTok, Web, Offline, WhatsApp)
- Mencatat pengeluaran operasional (ads, ongkir, gaji)
- Menghasilkan laporan P&L bulanan

**Tujuan utama:** Membuat aplikasi internal yang sederhana untuk mencatat seluruh flow di atas dan menghasilkan laporan bulanan yang bisa diekspor ke spreadsheet.

**Non-goals (di luar scope):**
- Tidak butuh multi-user / role-based access (RLS)
- Tidak butuh login kompleks — cukup 1 akun akses
- Tidak butuh integrasi otomatis dengan API Shopee/TikTok di versi pertama (input manual dulu)
- Spreadsheet hanya sebagai **output**, bukan tempat input data
- Tidak menggunakan foto produk di UI (lihat §6)

---

## 2. Skala Produk

Katalog terdiri dari **21 artikel**, rata-rata **3 warna per artikel** → sekitar **~63 varian produk (SKU)** yang perlu didaftarkan di sistem. Ini mempengaruhi dua hal penting:

1. **Setup resep** dilakukan per varian (artikel + warna), bukan cuma per artikel — kain per warna biasanya beda roll/stok sendiri, meskipun bahan rasio-tetap (kancing, label) biasanya sama lintas warna dalam 1 artikel
2. **UI pemilihan produk** tidak bisa berupa 1 dropdown datar berisi 63 item (kepanjangan buat discroll user gaptek, apalagi tanpa foto). Solusinya **2 langkah**: pilih artikel dulu (21 opsi, nama jelas), baru pilih warna (biasanya 2-4 opsi) — lihat §5.1 dan §7

---

## 3. Target Pengguna

Pemilik/staff internal yang **tidak terbiasa dengan sistem digital kompleks (gaptek)**. Ini adalah prinsip desain paling penting di seluruh aplikasi:

> Setiap layar harus bisa dipakai tanpa training. Input data harian (terutama pemakaian bahan baku) harus lebih simpel daripada nulis di buku catatan manual.

---

## 4. Alur Proses (User Flow)

```
1. Pembelian Bahan Baku      → dicatat, stok bahan baku bertambah
2. Produksi                   → pilih artikel + warna + jumlah dibuat →
                                 stok bahan baku otomatis berkurang (lihat §5.1)
3. Biaya Produksi              → biaya tenaga kerja/overhead per batch
4. Stok Barang Jadi            → bertambah otomatis setelah produksi
5. Penjualan                   → pilih produk, channel (Shopee/TikTok/Web/Offline/WA),
                                 jumlah, harga jual → stok barang jadi berkurang
6. Pengeluaran Lain            → ads, ongkir, gaji, dll (tidak terkait produk)
7. Laporan Bulanan (P&L)       → otomatis terhitung, bisa diekspor ke spreadsheet
```

---

## 5. Requirement per Modul

### 5.1 Input Pemakaian Bahan Baku — **PALING KRITIS, HARUS SESIMPLE MUNGKIN**

Masalah: kalau user disuruh input manual "pakai kain 3 meter, kancing 12 pcs, resleting 2 pcs" setiap kali produksi, ini rawan salah dan bikin capek buat user yang gaptek. Masalah tambahan: **yield kain tidak konsisten** — 1 yard kain kadang jadi 30 pcs, kadang 35 pcs, tergantung efisiensi potong per batch. Rasio tetap tidak bisa dipakai untuk kain.

**Solusi: kombinasi "Resep Produk" (untuk bahan rasio tetap) + input aktual (untuk bahan yield variatif)**

Bahan baku dibagi jadi dua kategori:

1. **Rasio tetap** (kancing, label, resleting, dll) — selalu sama per pcs produk, jadi bisa pakai resep/BOM yang didefinisikan sekali di awal per artikel:
   - Kemeja Lengan Panjang = 6 pcs kancing + 1 pcs label
2. **Yield variatif** (kain) — tidak bisa dipatok rasio tetap karena hasil potong beda-beda tiap batch, dan kain per warna adalah stok terpisah

Saat produksi harian, user cuma perlu input:
1. Pilih **artikel** dari daftar (21 opsi, nama jelas, tanpa foto)
2. Pilih **warna** dari daftar warna artikel tersebut (biasanya 2-4 opsi)
3. Input jumlah yang diproduksi (contoh: 30 pcs)
4. Input kain yang terpakai di batch ini (contoh: 1 yard) — satu angka simpel, bukan rasio

Sistem otomatis:
- Mengurangi stok kancing/label berdasarkan resep × jumlah produk
- Mengurangi stok kain **sesuai warna yang dipilih**, sejumlah angka yang diinput langsung (bukan hasil kalkulasi resep)
- Menyimpan yield batch ini (30 pcs/yard) sebagai data historis — berguna untuk analisis efisiensi potong dari waktu ke waktu, tanpa user perlu input rate itu sendiri

**UI yang disarankan:**
- Layar produksi: alur 2 langkah pilih (artikel → warna) lalu 2 field angka besar (jumlah jadi, kain terpakai), pakai stepper +/- atau angka besar — tanpa foto, cukup nama artikel & warna yang jelas dan konsisten
- Tombol besar "Simpan Produksi" — setelah ditekan, langsung tampil ringkasan: "Kain [Warna X] berkurang 1 yard, Kancing berkurang 180pcs, Stok [Artikel - Warna X] bertambah 30pcs"
- Ini penting supaya user merasa yakin datanya benar tanpa harus mengerti sistem di baliknya

**Edge case yang perlu ditangani:**
- Kalau stok bahan (kain warna tertentu atau bahan rasio tetap) tidak cukup untuk input yang dimasukkan, sistem kasih peringatan sebelum simpan (bukan setelah)
- Kalau ada pemakaian bahan ekstra di luar resep untuk bahan rasio tetap (misal ada yang rusak/reject), sediakan field opsional "tambahan pemakaian" — tapi disembunyikan di balik tombol "lainnya" biar layar utama tetap simpel
- Bahan mana saja yang dikategorikan "yield variatif" vs "rasio tetap" ditentukan saat setup resep produk di awal (per-bahan, bukan per-produk)

### 5.1.1 Penanganan Barang Reject & Inventori Terpisah

Dalam dunia manufaktur garment, pemotongan dan penjahitan tidak selalu menghasilkan 100% barang sempurna (Grade A). Terdapat barang yang cacat/afkir (Reject) akibat cacat kain, kesalahan jahit, atau noda minyak.

**Prinsip Akuntansi & Alur Sistem:**
1. **Bahan Baku & Ongkos:** Bahan baku (kain dan aksesoris BOM) serta ongkos jahit tetap terpakai penuh untuk total potongan `(Qty Bagus + Qty Reject)`.
2. **Pencatatan Produksi:** Form produksi memiliki input terpisah untuk `Qty Bagus (Grade A)` dan `Qty Reject (Afkir)`.
3. **Pemisahan Inventori:** 
   - `stock_qty`: Menampung stok siap jual (Grade A).
   - `stock_reject_qty`: Menampung inventori barang reject terpisah agar tidak merusak stok dagang utama.
4. **HPP Unit Siap Jual:** Seluruh biaya batch diserap oleh unit bagus (`Total Biaya Batch ÷ Qty Bagus`), sehingga HPP barang bagus merefleksikan biaya riil produksi.
5. **Penjualan Terpisah:** Modul penjualan menyediakan filter mutu (`Grade A` vs `Reject / Cuci Gudang`) dengan pemotongan stok ke inventori yang tepat.
6. **Pelaporan Terpisah:** Dashboard dan export Excel memisahkan Omset Penjualan Reguler vs Omset Cuci Gudang Reject serta menghitung `Reject Rate (%)` per batch untuk kontrol efisiensi operasional.

### 5.2 Pembelian Bahan Baku

- Form simpel: pilih bahan baku (dropdown — untuk kain, pilih warna juga), jumlah, harga satuan, tanggal, supplier (opsional)
- Otomatis menambah stok bahan baku (per warna untuk kain)
- Riwayat pembelian bisa dilihat per bahan baku

### 5.3 Biaya Produksi

- Per batch produksi, tambahkan biaya lain di luar bahan baku (tenaga kerja, listrik/overhead)
- Sistem menghitung HPP (harga pokok produksi) per pcs = (total biaya bahan + biaya produksi) ÷ jumlah output barang jadi (Grade A)

### 5.4 Penjualan (Tersortir Mutu)

- Form: pilih mutu (`Grade A / Reguler` vs `Reject / Cuci Gudang`), pilih artikel → warna, pilih channel (Shopee/TikTok/Web/Offline/WhatsApp), jumlah, harga jual, tanggal
- Otomatis mengurangi stok sesuai mutu (`stock_qty` untuk Grade A atau `stock_reject_qty` untuk Reject)
- Profit per transaksi = harga jual − HPP produk terkait

### 5.5 Pengeluaran Lain

- Form: kategori (ads, ongkir kain, gaji karyawan, lainnya), jumlah, tanggal, keterangan
- Tidak terkait ke produk tertentu, langsung masuk ke laporan bulanan sebagai pengurang

### 5.6 Laporan P&L Bulanan

- Dashboard menampilkan ringkasan bulan berjalan: Revenue (Reguler & Reject), COGS, Gross Profit, Total Pengeluaran, Net Profit, dan Reject Rate (%)
- Tombol "Export ke Spreadsheet" — generate file .xlsx untuk bulan yang dipilih dengan sheet terpisah (Laba Rugi, Penjualan Reguler vs Reject, Riwayat Produksi & Kualitas, Pembelian Bahan, Pengeluaran Operasional, Inventori Terpisah)

---

## 6. Skema Data (Ringkas)

| Tabel | Kolom Kunci / Fungsi |
|---|---|
| `articles` | Master 21 artikel (nama, deskripsi) |
| `product_variants` | Varian per artikel + warna (~63 SKU), `stock_qty` (Grade A), `stock_reject_qty` (Reject) |
| `raw_materials` | Master bahan baku rasio-tetap (kancing, label, dll) + stok |
| `fabric_stock` | Stok kain per warna (terpisah karena yield variatif & per-warna) |
| `product_recipes` | Resep/BOM: artikel → daftar bahan rasio-tetap + qty per 1 pcs |
| `purchases` | Riwayat pembelian bahan baku (termasuk kain per warna) |
| `production_batches` | Riwayat produksi (`qty_produced` Bagus, `qty_reject` Afkir, kain terpakai, tanggal, status bayar ongkos) |
| `production_costs` | Biaya per batch produksi (tenaga kerja, overhead) |
| `sales` | Riwayat penjualan (`item_grade` 'grade_a'/'reject', varian, channel, harga jual) |
| `expenses` | Pengeluaran operasional non-produk |

---

## 7. Prinsip Desain UI

1. **Angka besar, tombol besar** — hindari teks kecil dan form panjang
2. **Pilihan bertingkat, bukan daftar panjang** — dengan ~63 varian dan tanpa foto, pemilihan produk selalu 2 langkah (artikel → warna), bukan 1 dropdown besar
3. **Pemisahan Grade A & Reject yang visual** — warna hijau untuk Grade A, warna amber/emas untuk Reject
4. **Auto-kalkulasi di depan mata** — estimasi bahan baku dihitung dari total potongan (Bagus + Reject)
5. **Konfirmasi setelah aksi** — selalu tampilkan ringkasan hasil ("Stok Bagus bertambah X, Stok Reject bertambah Y, Bahan berkurang Z")
6. **Sembunyikan kompleksitas** — fitur lanjutan diletakkan di balik modal atau menu terpisah

---

## 8. Rencana Teknis

- **Frontend/Backend:** Next.js (App Router)
- **Database:** Supabase (Postgres), dengan SQL View `v_monthly_pl`, `v_monthly_production_cost`, `v_inventory_summary`
- **Export spreadsheet:** generate `.xlsx` multi-sheet on-demand via `exceljs`
- **Hosting:** Vercel (frontend)

---

## 9. Tahapan Implementasi (Saran)

1. Setup schema database + master 21 artikel & ~63 varian (artikel × warna) + resep bahan rasio-tetap + support reject tracking
2. Modul Pembelian Bahan Baku + Stok (termasuk stok kain per warna)
3. Modul Produksi (pilih artikel → warna, input hasil bagus & reject, auto-kalkulasi bahan)
4. Modul Penjualan (pilihan mutu Grade A vs Reject, 5 channel) + Pengeluaran
5. Dashboard P&L + Export Spreadsheet Multi-Sheet

---

## 10. Keputusan yang Sudah Diambil

- Channel penjualan: Shopee, TikTok, Web, **Offline, WhatsApp**
- **Tidak** menggunakan foto produk — pemilihan produk mengandalkan nama artikel + warna yang jelas, dengan alur bertingkat (§5.1, §7)
- Skala katalog: **21 artikel, rata-rata 3 warna/artikel (~63 varian)**
- **Barang Reject:** dicatat terpisah, inventori terpisah (`stock_reject_qty`), penjualan terpisah (`item_grade`), dan laporan P&L terpisah agar tidak mendistorsi laporan barang bagus.

