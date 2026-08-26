'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import { generateExcelReport, ReportData } from "@/lib/exportExcel";
import { 
  getDbProductionBatches, 
  getDbPurchases, 
  getDbSales, 
  getDbExpenses, 
  getDbArticles,
  getDbChannels
} from "@/lib/services/db";
import { 
  Download, 
  ShoppingBag, 
  Scissors, 
  FileSpreadsheet
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LaporanPage() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [rawBatches, setRawBatches] = useState<any[]>([]);
  const [rawPurchases, setRawPurchases] = useState<any[]>([]);
  const [rawSales, setRawSales] = useState<any[]>([]);
  const [rawExpenses, setRawExpenses] = useState<any[]>([]);
  const [rawArticles, setRawArticles] = useState<any[]>([]);
  const [rawChannels, setRawChannels] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batches, purchases, sales, expenses, articles, channels] = await Promise.all([
        getDbProductionBatches(),
        getDbPurchases(),
        getDbSales(),
        getDbExpenses(),
        getDbArticles(),
        getDbChannels(),
      ]);

      setRawBatches(batches || []);
      setRawPurchases(purchases || []);
      setRawSales(sales || []);
      setRawExpenses(expenses || []);
      setRawArticles(articles || []);
      setRawChannels(channels || []);

      const monthSet = new Set<string>();
      const addDate = (d?: string) => {
        if (!d) return;
        const dateObj = new Date(d);
        if (!isNaN(dateObj.getTime())) {
          const mName = `${MONTH_NAMES[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
          monthSet.add(mName);
        }
      };

      (batches || []).forEach(b => addDate(b.batch_date));
      (purchases || []).forEach(p => addDate(p.purchase_date));
      (sales || []).forEach(s => addDate(s.sale_date));
      (expenses || []).forEach(e => addDate(e.expense_date));

      const now = new Date();
      const currentMonthName = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
      monthSet.add(currentMonthName);

      const monthsArr = Array.from(monthSet);
      setAvailableMonths(monthsArr);
      setSelectedMonth(monthsArr[0] || currentMonthName);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterByMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const mName = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    return mName === selectedMonth;
  };

  const monthSales = rawSales.filter(s => filterByMonth(s.sale_date));
  const monthBatches = rawBatches.filter(b => filterByMonth(b.batch_date));
  const monthPurchases = rawPurchases.filter(p => filterByMonth(p.purchase_date));
  const monthExpenses = rawExpenses.filter(e => filterByMonth(e.expense_date));

  const regularSales = monthSales.filter(s => s.item_grade === 'grade_a');
  const rejectSales = monthSales.filter(s => s.item_grade === 'reject');

  const regularRevenue = regularSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const rejectRevenue = rejectSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const revenue = regularRevenue + rejectRevenue;

  const regularQtySold = regularSales.reduce((sum, s) => sum + s.qty, 0);
  const rejectQtySold = rejectSales.reduce((sum, s) => sum + s.qty, 0);

  const batchSewingCost = monthBatches.reduce((sum, b) => sum + (b.total_sewing_cost || 0), 0);
  const purchaseCost = monthPurchases.reduce((sum, p) => sum + (p.total_price || 0), 0);
  const cogs = batchSewingCost + purchaseCost;

  const grossProfit = revenue - cogs;
  const expenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = grossProfit - expenses;

  const salesByChannel = rawChannels.map(ch => {
    const chSales = monthSales.filter(s => s.channel_id === ch.id || s.channels?.name === ch.name);
    const reg = chSales.filter(s => s.item_grade === 'grade_a');
    const rej = chSales.filter(s => s.item_grade === 'reject');

    const regQty = reg.reduce((sum, s) => sum + s.qty, 0);
    const rejQty = rej.reduce((sum, s) => sum + s.qty, 0);
    const regRev = reg.reduce((sum, s) => sum + (s.total_price || 0), 0);
    const rejRev = rej.reduce((sum, s) => sum + (s.total_price || 0), 0);

    return {
      channel: ch.name,
      regularQty: regQty,
      rejectQty: rejQty,
      totalQty: regQty + rejQty,
      regularRevenue: regRev,
      rejectRevenue: rejRev,
      totalRevenue: regRev + rejRev,
    };
  });

  const productionBatches = monthBatches.map(b => {
    const totalCut = (b.qty_produced || 0) + (b.qty_reject || 0);
    const rejRate = totalCut > 0 ? Number(((b.qty_reject / totalCut) * 100).toFixed(1)) : 0;
    return {
      date: b.batch_date,
      article: b.articles?.name || 'Produk',
      variant: b.variants?.color || 'Varian',
      qtyGood: b.qty_produced,
      qtyReject: b.qty_reject || 0,
      totalCut,
      fabricUsed: b.fabric_used,
      yieldRate: b.yield_ratio,
      rejectRatePct: rejRate,
    };
  });

  const purchases = monthPurchases.map(p => ({
    date: p.purchase_date,
    material: p.material_name,
    qty: p.qty,
    unit: p.unit,
    totalCost: p.total_price,
  }));

  const expenseList = monthExpenses.map(e => ({
    date: e.expense_date,
    category: e.category,
    amount: e.amount,
    notes: e.notes || '',
  }));

  const rejectInventorySummary = rawArticles.flatMap(a =>
    (a.variants || []).map((v: any) => ({
      article: a.name,
      variant: v.color,
      readyStock: v.stock_qty,
      rejectStock: v.stock_reject_qty || 0,
    }))
  );

  const reportData: ReportData = {
    month: selectedMonth,
    revenue,
    regularRevenue,
    rejectRevenue,
    regularQtySold,
    rejectQtySold,
    cogs,
    grossProfit,
    expenses,
    netProfit,
    salesByChannel,
    productionBatches,
    purchases,
    expenseList,
    rejectInventorySummary,
  };

  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';

  const totalMonthCut = productionBatches.reduce((acc, b) => acc + b.totalCut, 0);
  const totalMonthGood = productionBatches.reduce((acc, b) => acc + b.qtyGood, 0);
  const totalMonthReject = productionBatches.reduce((acc, b) => acc + b.qtyReject, 0);
  const monthRejectRatePct = totalMonthCut > 0 ? ((totalMonthReject / totalMonthCut) * 100).toFixed(1) : '0.0';

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateExcelReport(reportData);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal mengekspor laporan Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Laporan Keuangan & Mutu Manufaktur" 
        description="Analisis laba rugi bulanan (P&L), segmentasi omset Grade A vs Cuci Gudang Reject, dan rasio efisiensi produksi"
        action={
          <div className="flex items-center gap-3">
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs sm:text-sm font-semibold text-[#e2e6ed] focus:border-[#4a6d8c] outline-none cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3d5a80] hover:bg-[#b89860] text-[#e2e6ed] rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Mengunduh...' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-[#0e1219] border border-[#1e2330] rounded-2xl">
          <p className="text-[0.65rem] text-[#8899aa] uppercase tracking-wider font-semibold">Total Pendapatan</p>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] mt-1 font-mono">
            Rp {revenue.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270] mt-2 pt-2 border-t border-[#1e2330]">
            <span>Grade A: Rp {(regularRevenue / 1000).toFixed(0)}k</span>
            <span>Reject: Rp {(rejectRevenue / 1000).toFixed(0)}k</span>
          </div>
        </div>

        <div className="p-4 bg-[#0e1219] border border-[#1e2330] rounded-2xl">
          <p className="text-[0.65rem] text-[#8899aa] uppercase tracking-wider font-semibold">Beban Pokok (HPP / Biaya)</p>
          <p className="text-xl sm:text-2xl font-black text-[#c8a870] mt-1 font-mono">
            Rp {cogs.toLocaleString('id-ID')}
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2 pt-2 border-t border-[#1e2330]">
            Laba Kotor: Rp {grossProfit.toLocaleString('id-ID')} ({grossMargin}%)
          </p>
        </div>

        <div className="p-4 bg-[#0e1219] border border-[#1e2330] rounded-2xl">
          <p className="text-[0.65rem] text-[#8899aa] uppercase tracking-wider font-semibold">Biaya Operasional</p>
          <p className="text-xl sm:text-2xl font-black text-[#c87070] mt-1 font-mono">
            Rp {expenses.toLocaleString('id-ID')}
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2 pt-2 border-t border-[#1e2330]">
            {expenseList.length} pos biaya dicatat
          </p>
        </div>

        <div className="p-4 bg-[#0e1219] border border-[#1e2330] rounded-2xl">
          <p className="text-[0.65rem] text-[#8899aa] uppercase tracking-wider font-semibold">Laba Bersih (Net Profit)</p>
          <p className={`text-xl sm:text-2xl font-black mt-1 font-mono ${netProfit >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}`}>
            Rp {netProfit.toLocaleString('id-ID')}
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-2 pt-2 border-t border-[#1e2330]">
            Net Profit Margin: <strong className={netProfit >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{netMargin}%</strong>
          </p>
        </div>
      </div>

      {/* Production Quality Summary */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] space-y-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#7a8a9a]" />
            <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Statistik Mutu Produksi Bulan Ini</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl">
              <span className="text-[0.65rem] text-[#5a6270]">Total Potong:</span>
              <p className="text-base font-extrabold text-[#e2e6ed]">{totalMonthCut} pcs</p>
            </div>
            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl">
              <span className="text-[0.65rem] text-[#8ab896]">Grade A:</span>
              <p className="text-base font-extrabold text-[#8ab896]">{totalMonthGood} pcs</p>
            </div>
            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl">
              <span className="text-[0.65rem] text-[#c8a870]">Reject:</span>
              <p className="text-base font-extrabold text-[#c8a870]">{totalMonthReject} pcs</p>
            </div>
          </div>

          <div className="p-3 bg-[#151a24] border border-[#2a3040] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#8899aa]">Persentase Reject Bulan Ini:</span>
            <span className={`font-bold font-mono text-sm ${Number(monthRejectRatePct) > 5 ? 'text-[#c87070]' : 'text-[#6ea87a]'}`}>
              {monthRejectRatePct}%
            </span>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border-[#1e2330] space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#7a8a9a]" />
            <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Performa Penjualan per Channel</h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1e2330]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0e1219] text-[#5a6270] text-[0.65rem] uppercase tracking-wider border-b border-[#1e2330]">
                  <th className="p-3">Channel</th>
                  <th className="p-3 text-right">Grade A</th>
                  <th className="p-3 text-right">Reject</th>
                  <th className="p-3 text-right">Total Qty</th>
                  <th className="p-3 text-right">Total Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2330]">
                {salesByChannel.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-[#5a6270]">Belum ada channel terdaftar.</td>
                  </tr>
                ) : (
                  salesByChannel.map((ch, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-semibold text-[#e2e6ed]">{ch.channel}</td>
                      <td className="p-3 text-right font-mono text-[#8ab896]">{ch.regularQty} pcs</td>
                      <td className="p-3 text-right font-mono text-[#c8a870]">{ch.rejectQty} pcs</td>
                      <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">{ch.totalQty} pcs</td>
                      <td className="p-3 text-right font-mono font-bold text-[#8ab896]">
                        Rp {ch.totalRevenue.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Financial Structure Breakdown */}
      <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
        <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#8ab896]" />
          <span>Struktur Laba Rugi (P&L Realistis)</span>
        </h2>
        <div className="space-y-2 divide-y divide-[#1e2330] text-xs">
          <div className="space-y-1 pt-1">
            <div className="flex justify-between font-semibold text-[#e2e6ed]">
              <span>Pendapatan Penjualan Total</span>
              <span className="font-mono text-[#8ab896]">Rp {revenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[0.7rem] text-[#8899aa] pl-3">
              <span>• Penjualan Normal (Grade A)</span>
              <span className="font-mono text-[#8ab896]">Rp {regularRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[0.7rem] text-[#8899aa] pl-3">
              <span>• Penjualan Cuci Gudang (Reject)</span>
              <span className="font-mono text-[#c8a870]">Rp {rejectRevenue.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <div>
              <span className="text-[#8899aa]">(-) Beban Pokok Produksi & Pembelian Bahan (HPP)</span>
              <p className="text-[0.65rem] text-[#5a6270]">Total ongkos jahit & pembelian bahan baku</p>
            </div>
            <span className="font-bold text-[#c8a870] font-mono">- Rp {cogs.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between pt-2 bg-[#0c0f17] p-2.5 rounded-xl border border-[#1e2330]">
            <span className="font-bold text-[#e2e6ed]">(=) Laba Kotor (Gross Profit)</span>
            <span className="font-black text-[#e2e6ed] font-mono">
              Rp {grossProfit.toLocaleString('id-ID')} 
              <span className="text-xs text-[#5a6270] font-normal ml-1">({grossMargin}%)</span>
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-[#8899aa]">(-) Total Beban Operasional</span>
            <span className="font-semibold text-[#c87070] font-mono">- Rp {expenses.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between pt-3 bg-[#1a2a20] p-3 rounded-xl border border-[#2a3a30]">
            <span className="font-bold text-[#8ab896] text-sm">(=) Laba Bersih Akhir</span>
            <span className={`font-black text-sm sm:text-base font-mono ${netProfit >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
