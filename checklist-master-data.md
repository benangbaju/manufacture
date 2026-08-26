# Checklist Master Data — Sebelum Aplikasi Bisa Dipakai

Dokumen ini adalah kerja manual (bukan coding) yang perlu diselesaikan dulu supaya data di aplikasi akurat sejak hari pertama. Isi tiap tabel di bawah, lalu ini yang akan di-input ke database sesuai `schema-manufaktur-cashflow.sql` (v1.1).

---

## 1. Daftar Artikel & Warna (target: 21 artikel)

Isi nama artikel dan warna yang tersedia untuk tiap artikel. Warna akan jadi varian (SKU) terpisah.

| No | Nama Artikel | Warna 1 | Warna 2 | Warna 3 | Warna 4 (opsional) |
|----|---|---|---|---|---|
| 1  | Kemeja Lengan Panjang *(contoh)* | Putih | Biru | Hitam | |
| 2  |   |   |   |   |   |
| 3  |   |   |   |   |   |
| 4  |   |   |   |   |   |
| 5  |   |   |   |   |   |
| 6  |   |   |   |   |   |
| 7  |   |   |   |   |   |
| 8  |   |   |   |   |   |
| 9  |   |   |   |   |   |
| 10 |   |   |   |   |   |
| 11 |   |   |   |   |   |
| 12 |   |   |   |   |   |
| 13 |   |   |   |   |   |
| 14 |   |   |   |   |   |
| 15 |   |   |   |   |   |
| 16 |   |   |   |   |   |
| 17 |   |   |   |   |   |
| 18 |   |   |   |   |   |
| 19 |   |   |   |   |   |
| 20 |   |   |   |   |   |
| 21 |   |   |   |   |   |

> Catatan: baris warna kosong = artikel itu tidak punya varian warna sebanyak itu. Rata-rata 3 warna/artikel jadi kolom "Warna 4" boleh sering kosong.

---

## 2. Daftar Bahan Baku Rasio Tetap (kancing, label, resleting, dll)

Bahan yang **bukan** kain — dipakai dengan jumlah yang selalu sama per pcs produk.

| No | Nama Bahan | Satuan | Stok Awal |
|----|---|---|---|
| 1  | Kancing Kemeja Putih *(contoh)* | pcs | 500 |
| 2  |   |   |   |
| 3  |   |   |   |
| 4  |   |   |   |
| 5  |   |   |   |
| 6  |   |   |   |
| 7  |   |   |   |
| 8  |   |   |   |

*(tambah baris sesuai kebutuhan)*

---

## 3. Daftar Kain per Warna (yield variatif, stok terpisah)

Kain dicatat per warna karena tiap warna = roll/stok berbeda.

| No | Nama Kain (termasuk warna) | Satuan | Stok Awal |
|----|---|---|---|
| 1  | Kain Denim Biru *(contoh)* | yard | 50 |
| 2  |   |   |   |
| 3  |   |   |   |
| 4  |   |   |   |
| 5  |   |   |   |
| 6  |   |   |   |
| 7  |   |   |   |
| 8  |   |   |   |

*(tambah baris sesuai kebutuhan — biasanya jumlah baris ≈ jumlah warna unik di seluruh artikel)*

---

## 4. Resep Produk per Artikel (bahan rasio tetap saja — TIDAK termasuk kain)

Isi untuk **setiap artikel** dari tabel §1, berapa jumlah tiap bahan rasio-tetap yang dipakai untuk membuat **1 pcs**. Resep ini berlaku sama untuk semua warna dalam 1 artikel.

| Nama Artikel | Nama Bahan | Qty per 1 pcs |
|---|---|---|
| Kemeja Lengan Panjang *(contoh)* | Kancing Kemeja Putih | 6 |
| Kemeja Lengan Panjang *(contoh)* | Label | 1 |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

> Tips pengisian: 1 artikel biasanya butuh beberapa baris (1 baris per jenis bahan). Isi semua kombinasi artikel × bahan yang relevan.

---

## 5. Pemetaan Varian ke Jenis Kain → tabel `variant_fabric_mapping`

Untuk tiap varian (artikel + warna), kain mana yang dipakai. Data ini akan di-input ke tabel `variant_fabric_mapping` supaya saat produksi, sistem bisa **auto-suggest** kain yang benar. Kolom "Kain Utama" = `is_primary = true`.

| Nama Artikel | Warna Varian | Nama Kain yang Dipakai (dari §3) | Kain Utama? |
|---|---|---|---|
| Kemeja Lengan Panjang *(contoh)* | Biru | Kain Denim Biru | Ya |
| Kemeja Lengan Panjang *(contoh)* | Hitam | Kain Denim Hitam | Ya |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

---

## 6. Checklist Sebelum Go-Live

- [ ] Semua 21 artikel + warna di §1 sudah lengkap
- [ ] Semua bahan rasio-tetap di §2 sudah didaftar dengan stok awal yang benar (hasil stock opname terbaru)
- [ ] Semua kain per warna di §3 sudah didaftar dengan stok awal (yard/meter aktual di gudang)
- [ ] Resep tiap artikel di §4 sudah diisi lengkap (cek ke pola potong/produksi asli, jangan tebak-tebak)
- [ ] Pemetaan varian → kain di §5 sudah benar (terutama kalau ada artikel yang pakai lebih dari 1 jenis kain)
- [ ] Channel penjualan sudah sesuai di tabel `sales_channels` (default: Shopee, TikTok, Web, Offline, WhatsApp — tambah jika perlu)
- [ ] Harga jual default per channel sudah disiapkan, meskipun ini diinput manual tiap transaksi
- [ ] Kategori pengeluaran rutin (ads, ongkir, gaji, dll) sudah disepakati namanya, biar konsisten dipakai tiap bulan
