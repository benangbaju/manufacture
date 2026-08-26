import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { 
  TrendingUp, 
  Coins, 
  Shirt, 
  Scissors, 
  ArrowUpRight, 
  Factory, 
  ShoppingBag, 
  PackagePlus, 
  FileSpreadsheet, 
  Layers, 
  Receipt,
  Sparkles,
  Wallet
} from 'lucide-react';

export default function Home() {
  return (
    <div>
      <PageHeader 
        title="Ringkasan Eksekutif" 
        description="Pantau arus kas, performa produksi, dan stok aktual bulan Agustus 2026"
        action={
          <Link
            href="/laporan"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm group"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#7a8a9a]" />
            <span>Buka Laporan P&L</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        }
      />

      {/* KPI Financial & Stock Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
        {/* Total Kas Saat Ini */}
        <div className="col-span-2 sm:col-span-1 glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group border-[#2a3848] bg-[#151a24]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">Total Kas Saat Ini</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2838] text-[#aab8c8] flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight">Rp 29.95 jt</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center text-[0.65rem] font-bold text-[#6ea87a] bg-[#1a2a20] px-1.5 py-0.5 rounded">
              Kas Riil
            </span>
            <span className="text-[0.65rem] text-[#5a6270]">likuiditas siap pakai</span>
          </div>
        </div>

        {/* Omset */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Omset Bulan Ini</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight">Rp 48.5 jt</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center text-[0.65rem] font-bold text-[#6ea87a] bg-[#1a2a20] px-1.5 py-0.5 rounded">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +15.2%
            </span>
            <span className="text-[0.65rem] text-[#5a6270]">vs bulan lalu</span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Laba Bersih</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2a20] text-[#6ea87a] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight">Rp 17.4 jt</p>
          <p className="text-[0.65rem] text-[#8899aa] mt-2 font-medium">Net Margin: <span className="font-bold text-[#e2e6ed]">36.0%</span></p>
        </div>

        {/* Stok Baju Jadi */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Stok Baju Jadi</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight">1,240 <span className="text-sm font-normal text-[#5a6270]">pcs</span></p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2">Tersebar di <span className="text-[#b0b8c4] font-semibold">63 SKU</span></p>
        </div>

        {/* Stok Kain */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Stok Kain</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight">450 <span className="text-sm font-normal text-[#5a6270]">meter</span></p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2">10 varian kain roll</p>
        </div>
      </div>

      {/* Operational Panels */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Panel 1: Master & Resep (Setup Awal) */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[0.65rem] font-bold text-[#6b8aaf] uppercase tracking-wider block">Tahap 1: Setup Awal</span>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Master & Resep BOM</h2>
              </div>
            </div>
            <p className="text-xs text-[#5a6270] mb-4 leading-relaxed">Kelola katalog 21 artikel, 63 SKU varian, resep bahan rasio-tetap, dan stok kain.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link 
              href="/master/artikel" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Shirt className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>21 Artikel & Varian Warna</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
            <Link 
              href="/master/kain" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>Stok Kain per Warna</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
            <Link 
              href="/master/resep" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>Resep Bahan (BOM)</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </div>

        {/* Panel 2: Transaksi Operasional Harian (Flow: Beli -> Produksi -> Penjualan) */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
                <Factory className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[0.65rem] font-bold text-[#b89860] uppercase tracking-wider block">Tahap 2: Operasional Harian</span>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Workflow Manufaktur</h2>
              </div>
            </div>
            <p className="text-xs text-[#5a6270] mb-4 leading-relaxed">Urutan alur kerja: Beli bahan baku &rarr; Catat hasil produksi &rarr; Penjualan produk.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link 
              href="/pembelian" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs transition-all shadow-sm active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <PackagePlus className="w-3.5 h-3.5 text-white/80" />
                <span>1. Catat Pembelian Bahan</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </Link>
            <Link 
              href="/produksi" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Factory className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>2. Catat Produksi Selesai</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
            <Link 
              href="/penjualan" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>3. Catat Penjualan Produk</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </div>

        {/* Panel 3: Keuangan & Laporan P&L */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1a2a20] text-[#6ea87a] flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[0.65rem] font-bold text-[#6ea87a] uppercase tracking-wider block">Tahap 3: Finansial & Evaluasi</span>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Keuangan & Laporan P&L</h2>
              </div>
            </div>
            <p className="text-xs text-[#5a6270] mb-4 leading-relaxed">Catat beban pengeluaran operasional dan pantau struktur laba rugi bulanan.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link 
              href="/pengeluaran" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>Catat Pengeluaran Operasional</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
            <Link 
              href="/laporan" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs transition-all shadow-sm active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Buka Laporan P&L & Excel</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

