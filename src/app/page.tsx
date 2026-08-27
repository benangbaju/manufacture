'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { getDbDashboardSummary } from "@/lib/services/db";
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
  Wallet,
  AlertCircle,
  Boxes,
  Eye,
  X,
  Tag
} from 'lucide-react';

export default function Home() {
  const [summary, setSummary] = useState<{
    cashBalance: number;
    totalRevenue: number;
    regularRevenue: number;
    rejectRevenue: number;
    totalFinishedStock: number;
    totalRejectStock: number;
    totalFabricStock: number;
    totalRawMaterialStock?: number;
    totalSKUCount: number;
    totalBatchesCount: number;
    avgHppOverall?: number;
    totalCogs?: number;
    grossProfit?: number;
    grossMarginPct?: number;
    finishedStockValuation?: number;
    rejectStockValuation?: number;
    fabricStockValuation?: number;
    rawMaterialStockValuation?: number;
    totalInventoryValuation?: number;
    potentialFinishedRevenue?: number;
    finishedItemDetails?: any[];
    fabricItemDetails?: any[];
    rawMaterialItemDetails?: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [valuationTab, setValuationTab] = useState<'finished' | 'fabric' | 'raw'>('finished');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getDbDashboardSummary();
        setSummary(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const cash = summary?.cashBalance || 0;
  const revenue = summary?.totalRevenue || 0;
  const regularRev = summary?.regularRevenue || 0;
  const rejectRev = summary?.rejectRevenue || 0;
  const finishedStock = summary?.totalFinishedStock || 0;
  const rejectStock = summary?.totalRejectStock || 0;
  const fabricStock = summary?.totalFabricStock || 0;
  const rawStock = summary?.totalRawMaterialStock || 0;
  const skuCount = summary?.totalSKUCount || 0;
  const avgHpp = summary?.avgHppOverall || 0;
  const grossProfit = summary?.grossProfit || 0;
  const grossMargin = summary?.grossMarginPct || 0;

  // Inventory Valuations
  const totalValuation = summary?.totalInventoryValuation || 0;
  const finishedVal = summary?.finishedStockValuation || 0;
  const rejectVal = summary?.rejectStockValuation || 0;
  const fabricVal = summary?.fabricStockValuation || 0;
  const rawVal = summary?.rawMaterialStockValuation || 0;
  const potentialRev = summary?.potentialFinishedRevenue || 0;

  return (
    <div>
      <PageHeader 
        title="Ringkasan Eksekutif" 
        description="Pantau arus kas riil, performa penjualan, HPP satuan, valuasi stok gudang, dan bahan baku langsung dari database"
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
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight font-mono">
            {loading ? '...' : `Rp ${(cash / 1000000).toFixed(2)} jt`}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center text-[0.65rem] font-bold text-[#6ea87a] bg-[#1a2a20] px-1.5 py-0.5 rounded">
              Kas Riil
            </span>
            <span className="text-[0.65rem] text-[#5a6270]">likuiditas siap pakai</span>
          </div>
        </div>

        {/* Omset & Margin */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Total Omset</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] tracking-tight font-mono">
            {loading ? '...' : `Rp ${(revenue / 1000000).toFixed(2)} jt`}
          </p>
          <div className="flex items-center justify-between mt-2 text-[0.65rem] text-[#5a6270]">
            <span>Laba Kotor:</span>
            <span className="text-[#8ab896] font-semibold font-mono">
              Rp {(grossProfit / 1000000).toFixed(1)}jt ({grossMargin}%)
            </span>
          </div>
        </div>

        {/* Rata-rata HPP Satuan */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group border-[#1e2a38]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">Rata-rata HPP</span>
            <div className="w-7 h-7 rounded-lg bg-[#15202b] text-[#7eb3db] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] tracking-tight font-mono">
            {loading ? '...' : `Rp ${avgHpp.toLocaleString('id-ID')}`}
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2">Biaya pokok / pcs baju</p>
        </div>

        {/* Stok Siap Jual */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Stok Siap Jual</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight font-mono">
            {loading ? '...' : finishedStock.toLocaleString('id-ID')} <span className="text-sm font-normal text-[#5a6270]">pcs</span>
          </p>
          <div className="flex items-center justify-between mt-2 text-[0.65rem] text-[#5a6270]">
            <span>{skuCount} SKU</span>
            {rejectStock > 0 && <span className="text-[#c8a870] font-semibold">Reject: {rejectStock} pcs</span>}
          </div>
        </div>

        {/* Stok Kain */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Stok Kain</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight font-mono">
            {loading ? '...' : fabricStock.toLocaleString('id-ID')} <span className="text-sm font-normal text-[#5a6270]">meter</span>
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2">Bahan baku kain roll</p>
        </div>
      </div>

      {/* Inventory Valuation Hub Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6 border-[#233548] bg-gradient-to-r from-[#121722] via-[#10141e] to-[#141a24] relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#1a2838] text-[#7eb3db] flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#7eb3db] uppercase tracking-wider">Valuasi Aset Fisik di Gudang (Modal Kerja Mengendap)</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-2xl sm:text-3xl font-black text-[#e2e6ed] tracking-tight font-mono">
                {loading ? '...' : `Rp ${(totalValuation / 1000000).toFixed(2)} jt`}
              </p>
              <span className="text-xs text-[#8899aa]">
                Potensi Omset Siap Jual: <strong className="text-[#8ab896] font-mono">Rp {(potentialRev / 1000000).toFixed(1)} jt</strong>
              </span>
            </div>
            <p className="text-[0.7rem] text-[#5a6270] mt-1">Total nilai modal kerja yang saat ini tersimpan dalam bentuk pakaian jadi, reject, kain roll, dan aksesoris.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowValuationModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2838] hover:bg-[#233548] border border-[#2a3c50] text-[#7eb3db] font-bold rounded-xl text-xs transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat Rincian Valuasi per SKU</span>
          </button>
        </div>

        {/* 4 Asset Valuation Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-[#1e2838]">
          <div className="p-3 bg-[#0c1017] border border-[#1e2838] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[0.65rem] text-[#8899aa] mb-1">
              <span>👕 Baju Grade A</span>
              <span className="font-mono text-[#e2e6ed] font-semibold">{finishedStock} pcs</span>
            </div>
            <span className="font-extrabold text-sm sm:text-base text-[#8ab896] font-mono">
              Rp {(finishedVal / 1000000).toFixed(1)} jt
            </span>
            <span className="text-[0.6rem] text-[#5a6270] mt-0.5">Siap dijual ke pasar</span>
          </div>

          <div className="p-3 bg-[#0c1017] border border-[#1e2838] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[0.65rem] text-[#8899aa] mb-1">
              <span>⚠️ Baju Reject</span>
              <span className="font-mono text-[#c8a870] font-semibold">{rejectStock} pcs</span>
            </div>
            <span className="font-extrabold text-sm sm:text-base text-[#c8a870] font-mono">
              Rp {(rejectVal / 1000000).toFixed(1)} jt
            </span>
            <span className="text-[0.6rem] text-[#5a6270] mt-0.5">Modal tertahan afkir</span>
          </div>

          <div className="p-3 bg-[#0c1017] border border-[#1e2838] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[0.65rem] text-[#8899aa] mb-1">
              <span>🧵 Kain Roll</span>
              <span className="font-mono text-[#e2e6ed] font-semibold">{fabricStock} m</span>
            </div>
            <span className="font-extrabold text-sm sm:text-base text-[#7eb3db] font-mono">
              Rp {(fabricVal / 1000000).toFixed(1)} jt
            </span>
            <span className="text-[0.6rem] text-[#5a6270] mt-0.5">Bahan baku kain roll</span>
          </div>

          <div className="p-3 bg-[#0c1017] border border-[#1e2838] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[0.65rem] text-[#8899aa] mb-1">
              <span>🏷️ Aksesoris (BOM)</span>
              <span className="font-mono text-[#e2e6ed] font-semibold">{rawStock} pcs</span>
            </div>
            <span className="font-extrabold text-sm sm:text-base text-[#b0b8c4] font-mono">
              Rp {(rawVal / 1000000).toFixed(1)} jt
            </span>
            <span className="text-[0.6rem] text-[#5a6270] mt-0.5">Kancing/label/resleting</span>
          </div>
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
            <p className="text-xs text-[#5a6270] mb-4 leading-relaxed">Kelola katalog artikel, varian warna, resep bahan rasio-tetap, dan stok kain roll.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link 
              href="/master/artikel" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Shirt className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>Master Artikel & Varian Warna</span>
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
                <span>2. Hasil Produksi (Potong & Jahit)</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
            <Link 
              href="/penjualan" 
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#b0b8c4] font-medium rounded-xl text-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-[#5a6270]" />
                <span>3. Penjualan & Margin</span>
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

      {/* Inventory Valuation Detail Modal */}
      {showValuationModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2330]">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#7eb3db]" />
                <div>
                  <h3 className="text-base font-bold text-[#e2e6ed]">Rincian Valuasi Nilai Stok di Gudang</h3>
                  <p className="text-xs text-[#8899aa]">Total Nilai Modal Fisik: <strong className="text-[#e2e6ed] font-mono">Rp {totalValuation.toLocaleString('id-ID')}</strong></p>
                </div>
              </div>
              <button onClick={() => setShowValuationModal(false)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValuationTab('finished')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  valuationTab === 'finished'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                👕 Baju Jadi & SKU (Rp {(finishedVal + rejectVal).toLocaleString('id-ID')})
              </button>
              <button
                type="button"
                onClick={() => setValuationTab('fabric')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  valuationTab === 'fabric'
                    ? 'bg-[#1a2838] text-[#7eb3db] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                🧵 Kain Roll (Rp {fabricVal.toLocaleString('id-ID')})
              </button>
              <button
                type="button"
                onClick={() => setValuationTab('raw')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  valuationTab === 'raw'
                    ? 'bg-[#1a2838] text-[#b0b8c4] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                🏷️ Aksesoris BOM (Rp {rawVal.toLocaleString('id-ID')})
              </button>
            </div>

            {/* Table Content */}
            <div className="overflow-y-auto flex-1 border border-[#1e2330] rounded-xl">
              {valuationTab === 'finished' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0c0f17] text-[#8899aa] border-b border-[#1e2330]">
                      <th className="p-3">Artikel & Varian</th>
                      <th className="p-3 text-center">Stok Grade A</th>
                      <th className="p-3 text-center">Stok Reject</th>
                      <th className="p-3 text-right">HPP Satuan</th>
                      <th className="p-3 text-right">Nilai Modal (Grade A)</th>
                      <th className="p-3 text-right">Potensi Omset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {(summary?.finishedItemDetails || []).length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-[#5a6270]">Belum ada stok produk jadi.</td></tr>
                    ) : (
                      (summary?.finishedItemDetails || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-semibold text-[#e2e6ed]">{item.articleName} - {item.color}</td>
                          <td className="p-3 text-center text-[#8ab896] font-bold font-mono">{item.goodQty} pcs</td>
                          <td className="p-3 text-center text-[#c8a870] font-mono">{item.rejectQty > 0 ? `${item.rejectQty} pcs` : '-'}</td>
                          <td className="p-3 text-right font-mono text-[#7eb3db]">Rp {item.hpp.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">Rp {item.goodValue.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right font-mono text-[#8ab896]">Rp {item.potentialRevenue.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {valuationTab === 'fabric' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0c0f17] text-[#8899aa] border-b border-[#1e2330]">
                      <th className="p-3">Nama Kain Roll</th>
                      <th className="p-3 text-center">Stok Gudang</th>
                      <th className="p-3 text-right">Harga Beli Rata-rata</th>
                      <th className="p-3 text-right">Total Nilai Aset Kain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {(summary?.fabricItemDetails || []).length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-[#5a6270]">Belum ada stok kain roll.</td></tr>
                    ) : (
                      (summary?.fabricItemDetails || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-semibold text-[#e2e6ed]">{item.name}</td>
                          <td className="p-3 text-center font-bold text-[#7eb3db] font-mono">{item.stockQty} {item.unit}</td>
                          <td className="p-3 text-right font-mono text-[#8899aa]">Rp {item.avgPrice.toLocaleString('id-ID')} / {item.unit}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">Rp {item.totalValue.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {valuationTab === 'raw' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0c0f17] text-[#8899aa] border-b border-[#1e2330]">
                      <th className="p-3">Nama Bahan Baku (BOM)</th>
                      <th className="p-3 text-center">Stok Gudang</th>
                      <th className="p-3 text-right">Harga Beli Rata-rata</th>
                      <th className="p-3 text-right">Total Nilai Aset Aksesoris</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {(summary?.rawMaterialItemDetails || []).length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-[#5a6270]">Belum ada stok bahan aksesoris.</td></tr>
                    ) : (
                      (summary?.rawMaterialItemDetails || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-semibold text-[#e2e6ed]">{item.name}</td>
                          <td className="p-3 text-center font-bold text-[#b0b8c4] font-mono">{item.stockQty} {item.unit}</td>
                          <td className="p-3 text-right font-mono text-[#8899aa]">Rp {item.avgPrice.toLocaleString('id-ID')} / {item.unit}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">Rp {item.totalValue.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowValuationModal(false)}
                className="px-5 py-2.5 bg-[#1a2030] text-[#b0b8c4] rounded-xl text-xs font-semibold hover:bg-[#222a3a]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
