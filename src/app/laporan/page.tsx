'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import { generateExcelReport, ReportData } from "@/lib/exportExcel";
import { 
  Download, 
  Calendar, 
  Coins, 
  Receipt, 
  Sparkles, 
  ShoppingBag, 
  Scissors, 
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Tag
} from 'lucide-react';

const dummyReports: Record<string, ReportData> = {
  'Agustus 2026': {
    month: 'Agustus 2026',
    revenue: 48500000,
    regularRevenue: 47200000,
    rejectRevenue: 1300000,
    regularQtySold: 440,
    rejectQtySold: 30,
    cogs: 24200000,
    grossProfit: 24300000,
    expenses: 6850000,
    netProfit: 17450000,
    salesByChannel: [
      { channel: 'Shopee', regularQty: 205, rejectQty: 5, totalQty: 210, regularRevenue: 22875000, rejectRevenue: 225000, totalRevenue: 23100000 },
      { channel: 'TikTok Shop', regularQty: 145, rejectQty: 0, totalQty: 145, regularRevenue: 15950000, rejectRevenue: 0, totalRevenue: 15950000 },
      { channel: 'WhatsApp / Chat', regularQty: 45, rejectQty: 0, totalQty: 45, regularRevenue: 4950000, rejectRevenue: 0, totalRevenue: 4950000 },
      { channel: 'Offline Store', regularQty: 10, rejectQty: 20, totalQty: 30, regularRevenue: 2400000, rejectRevenue: 900000, totalRevenue: 3300000 },
      { channel: 'Website', regularQty: 10, rejectQty: 0, totalQty: 10, regularRevenue: 1200000, rejectRevenue: 0, totalRevenue: 1200000 },
    ],
    productionBatches: [
      { date: '2026-08-24', article: 'Kemeja Lengan Panjang', variant: 'Putih', qtyGood: 58, qtyReject: 2, totalCut: 60, rejectRatePct: 3.3, fabricUsed: 2.0, yieldRate: 30.0 },
      { date: '2026-08-22', article: 'Celana Chino Pendek', variant: 'Khaki', qtyGood: 44, qtyReject: 1, totalCut: 45, rejectRatePct: 2.2, fabricUsed: 1.5, yieldRate: 30.0 },
      { date: '2026-08-18', article: 'Kaos Polos Oversize', variant: 'Hitam', qtyGood: 78, qtyReject: 2, totalCut: 80, rejectRatePct: 2.5, fabricUsed: 2.5, yieldRate: 32.0 },
      { date: '2026-08-14', article: 'Jaket Bomber', variant: 'Navy', qtyGood: 33, qtyReject: 2, totalCut: 35, rejectRatePct: 5.7, fabricUsed: 1.8, yieldRate: 19.4 },
    ],
    purchases: [
      { date: '2026-08-20', material: 'Kain Katun Putih', qty: 50, unit: 'yard', totalCost: 4500000 },
      { date: '2026-08-15', material: 'Kancing Kemeja Putih', qty: 1000, unit: 'pcs', totalCost: 350000 },
      { date: '2026-08-10', material: 'Kain Denim Biru', qty: 40, unit: 'yard', totalCost: 4800000 },
    ],
    expenseList: [
      { date: '2026-08-20', category: 'Ads (Iklan)', amount: 2500000, notes: 'Shopee Ads & TikTok Ads' },
      { date: '2026-08-15', category: 'Gaji Karyawan', amount: 3500000, notes: 'Gaji staf gudang & penjahit' },
      { date: '2026-08-10', category: 'Ongkir Kain', amount: 450000, notes: 'Ekspedisi kain Bandung-Jkt' },
      { date: '2026-08-05', category: 'Listrik & Operasional', amount: 400000, notes: 'Listrik workshop' },
    ],
    rejectInventorySummary: [
      { article: 'Kemeja Lengan Panjang', variant: 'Putih', readyStock: 120, rejectStock: 4 },
      { article: 'Kemeja Lengan Panjang', variant: 'Hitam', readyStock: 95, rejectStock: 2 },
      { article: 'Celana Chino Pendek', variant: 'Khaki', readyStock: 80, rejectStock: 3 },
      { article: 'Celana Chino Pendek', variant: 'Hitam', readyStock: 110, rejectStock: 5 },
      { article: 'Kaos Polos Oversize', variant: 'Putih', readyStock: 200, rejectStock: 6 },
    ]
  },
  'Juli 2026': {
    month: 'Juli 2026',
    revenue: 42000000,
    regularRevenue: 41200000,
    rejectRevenue: 800000,
    regularQtySold: 375,
    rejectQtySold: 20,
    cogs: 21500000,
    grossProfit: 20500000,
    expenses: 6200000,
    netProfit: 14300000,
    salesByChannel: [
      { channel: 'Shopee', regularQty: 190, rejectQty: 0, totalQty: 190, regularRevenue: 20900000, rejectRevenue: 0, totalRevenue: 20900000 },
      { channel: 'TikTok Shop', regularQty: 120, rejectQty: 0, totalQty: 120, regularRevenue: 13200000, rejectRevenue: 0, totalRevenue: 13200000 },
      { channel: 'WhatsApp / Chat', regularQty: 40, rejectQty: 0, totalQty: 40, regularRevenue: 4400000, rejectRevenue: 0, totalRevenue: 4400000 },
      { channel: 'Offline Store', regularQty: 15, rejectQty: 20, totalQty: 35, regularRevenue: 1950000, rejectRevenue: 800000, totalRevenue: 2750000 },
      { channel: 'Website', regularQty: 7, rejectQty: 0, totalQty: 7, regularRevenue: 750000, rejectRevenue: 0, totalRevenue: 750000 },
    ],
    productionBatches: [
      { date: '2026-07-25', article: 'Kemeja Lengan Panjang', variant: 'Hitam', qtyGood: 48, qtyReject: 2, totalCut: 50, rejectRatePct: 4.0, fabricUsed: 1.7, yieldRate: 29.4 },
      { date: '2026-07-15', article: 'Kaos Polos Oversize', variant: 'Putih', qtyGood: 68, qtyReject: 2, totalCut: 70, rejectRatePct: 2.8, fabricUsed: 2.2, yieldRate: 31.8 },
    ],
    purchases: [
      { date: '2026-07-10', material: 'Kain Katun Hitam', qty: 40, unit: 'yard', totalCost: 3600000 },
    ],
    expenseList: [
      { date: '2026-07-20', category: 'Ads (Iklan)', amount: 2000000, notes: 'Shopee Ads' },
      { date: '2026-07-15', category: 'Gaji Karyawan', amount: 3500000, notes: 'Gaji staf' },
      { date: '2026-07-05', category: 'Listrik & Operasional', amount: 700000, notes: 'Operasional workshop' },
    ],
    rejectInventorySummary: [
      { article: 'Kemeja Lengan Panjang', variant: 'Hitam', readyStock: 48, rejectStock: 2 },
      { article: 'Kaos Polos Oversize', variant: 'Putih', readyStock: 68, rejectStock: 2 },
    ]
  },
};

export default function LaporanPage() {
  const [selectedMonth, setSelectedMonth] = useState('Agustus 2026');
  const [isExporting, setIsExporting] = useState(false);

  const currentReport = dummyReports[selectedMonth] || dummyReports['Agustus 2026'];
  const netMargin = ((currentReport.netProfit / currentReport.revenue) * 100).toFixed(1);
  const grossMargin = ((currentReport.grossProfit / currentReport.revenue) * 100).toFixed(1);

  // Calculate monthly production quality metrics
  const totalMonthCut = currentReport.productionBatches.reduce((acc, b) => acc + b.totalCut, 0);
  const totalMonthGood = currentReport.productionBatches.reduce((acc, b) => acc + b.qtyGood, 0);
  const totalMonthReject = currentReport.productionBatches.reduce((acc, b) => acc + b.qtyReject, 0);
  const monthRejectRatePct = totalMonthCut > 0 ? ((totalMonthReject / totalMonthCut) * 100).toFixed(1) : '0.0';

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateExcelReport(currentReport);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal mengekspor laporan');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Laporan & Laba Rugi" 
        description="Analisis struktur keuangan, pemisahan omset reguler vs reject cuci gudang, dan download spreadsheet Excel lengkap"
        action={
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3d5a80] hover:bg-[#b89860] text-[#e2e6ed] font-semibold rounded-xl shadow-sm transition-all text-xs sm:text-sm disabled:opacity-50 active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Memproses File...' : 'Download Excel (.xlsx)'}</span>
          </button>
        }
      />

      {/* Month Selector Filter Bar */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between border-[#1e2330]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Periode Aktif</p>
            <p className="text-sm sm:text-base font-bold text-[#e2e6ed] tracking-tight">{selectedMonth}</p>
          </div>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 sm:px-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium appearance-none cursor-pointer"
        >
          {Object.keys(dummyReports).map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* P&L Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        {/* Omset Card with Segregation */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-[#1e2330]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Total Omset</p>
            <Coins className="w-4 h-4 text-[#7a8a9a]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight">Rp {currentReport.revenue.toLocaleString('id-ID')}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem] text-[#7a8a9a] mt-1.5">
            <span className="text-[#8ab896] font-semibold">Reguler: Rp {(currentReport.regularRevenue/1000000).toFixed(1)}jt</span>
            <span>•</span>
            <span className="text-[#c8a870] font-semibold">Reject: Rp {(currentReport.rejectRevenue/1000000).toFixed(1)}jt</span>
          </div>
        </div>

        {/* HPP Card */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-[#1e2330]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">HPP / COGS</p>
            <Scissors className="w-4 h-4 text-[#b89860]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#b89860] tracking-tight">Rp {currentReport.cogs.toLocaleString('id-ID')}</p>
          <p className="text-[0.65rem] text-[#5a6270] mt-1.5">Menyerap bahan baku & potong reject</p>
        </div>

        {/* Quality / Reject Rate Card */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-[#1e2330]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-semibold text-[#5a6270] uppercase tracking-wider">Reject Rate Produksi</p>
            <AlertTriangle className="w-4 h-4 text-[#c8a870]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#c8a870] tracking-tight">{monthRejectRatePct}%</p>
          <p className="text-[0.65rem] text-[#5a6270] mt-1.5">{totalMonthReject} pcs reject dari {totalMonthCut} pcs potong</p>
        </div>

        {/* Net Profit Card */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-[#2a3a30] bg-[#151a24]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-semibold text-[#6ea87a] uppercase tracking-wider">Laba Bersih</p>
            <Sparkles className="w-4 h-4 text-[#6ea87a]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#6ea87a] tracking-tight">Rp {currentReport.netProfit.toLocaleString('id-ID')}</p>
          <p className="text-[0.65rem] text-[#8899aa] mt-1.5 font-medium">Net Profit Margin: <span className="font-bold text-[#e2e6ed]">{netMargin}%</span></p>
        </div>
      </div>

      {/* Detail Breakdown Tables */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Sales by Channel */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
          <h2 className="text-sm sm:text-base font-bold text-[#e2e6ed] mb-4 flex items-center justify-between tracking-tight">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#7a8a9a]" />
              <span>Omset per Channel Penjualan</span>
            </span>
            <span className="text-[0.7rem] font-medium text-[#5a6270]">{currentReport.salesByChannel.length} Channel</span>
          </h2>
          <div className="space-y-3.5">
            {currentReport.salesByChannel.map(sc => {
              const share = ((sc.totalRevenue / currentReport.revenue) * 100).toFixed(0);
              return (
                <div key={sc.channel} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-[#b0b8c4]">{sc.channel}</span>
                      <span className="text-[#5a6270] text-[0.7rem] ml-1.5">
                        ({sc.regularQty} Bagus{sc.rejectQty > 0 ? `, ${sc.rejectQty} Reject` : ''})
                      </span>
                    </div>
                    <span className="font-bold text-[#e2e6ed]">Rp {sc.totalRevenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full bg-[#0c0f17] h-2 rounded-full overflow-hidden border border-[#1e2330]">
                    <div className="bg-[#4a6d8c] h-full rounded-full" style={{ width: `${share}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270]">
                    <span>
                      {sc.rejectRevenue > 0 && <span className="text-[#c8a870]">Reject: Rp {sc.rejectRevenue.toLocaleString('id-ID')}</span>}
                    </span>
                    <span>{share}% kontribusi omset</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Summary Structure (P&L Segregated) */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
          <h2 className="text-sm sm:text-base font-bold text-[#e2e6ed] mb-4 flex items-center gap-2 tracking-tight">
            <FileSpreadsheet className="w-4 h-4 text-[#6ea87a]" />
            <span>Struktur Laba Rugi (P&L Terpisah)</span>
          </h2>
          <div className="space-y-2 divide-y divide-[#1e2330] text-xs sm:text-sm">
            <div className="space-y-1 pt-1">
              <div className="flex justify-between font-semibold text-[#e2e6ed]">
                <span>Pendapatan Penjualan Total</span>
                <span>Rp {currentReport.revenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[0.75rem] text-[#8899aa] pl-3">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#6ea87a]" /> Omset Reguler (Grade A)</span>
                <span className="text-[#8ab896]">Rp {currentReport.regularRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[0.75rem] text-[#8899aa] pl-3">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-[#b89860]" /> Omset Cuci Gudang (Reject)</span>
                <span className="text-[#c8a870]">Rp {currentReport.rejectRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <div>
                <span className="text-[#8899aa]">(-) Harga Pokok Penjualan (HPP)</span>
                <p className="text-[0.65rem] text-[#5a6270]">Bahan & ongkos potong reject terserap ke HPP</p>
              </div>
              <span className="font-bold text-[#b89860]">- Rp {currentReport.cogs.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between pt-2 bg-[#0c0f17] p-2.5 rounded-xl border border-[#1e2330]">
              <span className="font-bold text-[#e2e6ed]">(=) Laba Kotor (Gross Profit)</span>
              <span className="font-black text-[#e2e6ed]">
                Rp {currentReport.grossProfit.toLocaleString('id-ID')} 
                <span className="text-xs text-[#5a6270] font-normal ml-1">({grossMargin}%)</span>
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-[#8899aa]">(-) Total Beban Operasional</span>
              <span className="font-semibold text-[#b85c5c]">- Rp {currentReport.expenses.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between pt-3 bg-[#1a2a20] p-3 rounded-xl border border-[#2a3a30]">
              <span className="font-bold text-[#6ea87a] text-sm">(=) Laba Bersih Akhir</span>
              <span className="font-black text-[#6ea87a] text-sm sm:text-base">Rp {currentReport.netProfit.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Batches Yield Performance & Reject Control */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6 border-[#1e2330]">
        <div className="p-4 border-b border-[#1e2330] flex items-center justify-between bg-[#0e1219]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#201e1a] text-[#b89860] flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Kontrol Kualitas Produksi & Yield Potong Kain</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Pemisahan hasil bagus (Grade A) vs reject afkir per batch pemotongan</p>
            </div>
          </div>
          <span className="text-[0.7rem] bg-[#1a2030] border border-[#2a3040] text-[#aab8c8] px-2.5 py-1 rounded-full font-semibold">
            Rata-rata Yield: 27.8 pcs/meter
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Artikel & Varian</th>
                <th className="p-3.5">Hasil Bagus</th>
                <th className="p-3.5">Reject</th>
                <th className="p-3.5">Total Potong</th>
                <th className="p-3.5">Reject Rate</th>
                <th className="p-3.5">Kain Terpakai</th>
                <th className="p-3.5">Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2330]">
              {currentReport.productionBatches.map((b, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 text-[#5a6270] font-mono text-xs">{b.date}</td>
                  <td className="p-3.5 font-semibold text-[#e2e6ed]">{b.article} - <span className="text-[#7a8a9a]">{b.variant}</span></td>
                  <td className="p-3.5 font-bold text-[#8ab896]">+{b.qtyGood} pcs</td>
                  <td className="p-3.5 font-bold text-[#c8a870]">+{b.qtyReject} pcs</td>
                  <td className="p-3.5 font-medium text-[#e2e6ed]">{b.totalCut} pcs</td>
                  <td className="p-3.5">
                    <span className={`font-bold px-2 py-0.5 rounded text-[0.7rem] ${
                      b.rejectRatePct <= 3.0 
                        ? 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]' 
                        : 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                    }`}>
                      {b.rejectRatePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3.5 text-[#8899aa]">{b.fabricUsed} meter</td>
                  <td className="p-3.5">
                    <span className="font-bold px-2 py-0.5 rounded text-[0.7rem] bg-[#1a2030] text-[#aab8c8] border border-[#2a3040]">
                      {b.yieldRate.toFixed(1)} pcs/m
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
