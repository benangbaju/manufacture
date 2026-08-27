'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  getDbArticles, 
  getDbChannels, 
  getDbSales, 
  getDbProductionBatches,
  createDbSale, 
  deleteDbSale 
} from "@/lib/services/db";
import { 
  Store, 
  AlertTriangle, 
  Clock, 
  Check, 
  Trash2, 
  CalendarDays, 
  DollarSign, 
  Tag,
  Plus,
  ShoppingBag,
  TrendingUp,
  Search
} from 'lucide-react';

interface VariantItem {
  id: number;
  color: string;
  stock_qty: number;
  stock_reject_qty: number;
}

interface ArticleItem {
  id: number;
  name: string;
  variants: VariantItem[];
}

interface ChannelItem {
  id: number;
  name: string;
}

interface SaleRecord {
  id: number;
  sale_date: string;
  article_id: number;
  variant_id: number;
  channel_id: number;
  item_grade: 'grade_a' | 'reject';
  qty: number;
  unit_price: number;
  total_price: number;
  articles?: { name: string };
  variants?: { color: string };
  channels?: { name: string };
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';
type GradeFilterOption = 'ALL' | 'GRADE_A' | 'REJECT';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function PenjualanPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [itemGrade, setItemGrade] = useState<'grade_a' | 'reject'>('grade_a');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [saleDate, setBatchDate] = useState<string>(getTodayDateString());

  // Filters (Default: ALL)
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [gradeFilter, setGradeFilter] = useState<GradeFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingSale, setDeletingSale] = useState<SaleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [artList, chList, saleList, batchList] = await Promise.all([
        getDbArticles(),
        getDbChannels(),
        getDbSales(),
        getDbProductionBatches(),
      ]);

      setArticles(artList || []);
      setChannels(chList || []);
      setSales(saleList || []);
      setBatches(batchList || []);

      if (artList && artList.length > 0 && !selectedArticleId) {
        setSelectedArticleId(artList[0].id);
        if (artList[0].variants && artList[0].variants.length > 0) {
          setSelectedVariantId(artList[0].variants[0].id);
        }
      }
      if (chList && chList.length > 0 && !selectedChannelId) {
        setSelectedChannelId(chList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute variant unit cost (HPP) map from batches
  const variantCostMap = new Map<number, { totalCost: number; totalQty: number }>();
  batches.forEach(b => {
    const vId = b.variant_id;
    const cut = Number(b.total_cut || (b.qty_produced + b.qty_reject) || 0);
    const prodCost = Number(b.total_production_cost || (b.fabric_cost + b.total_sewing_cost + (b.accessories_cost || 0)) || 0);
    if (vId && cut > 0) {
      const cur = variantCostMap.get(vId) || { totalCost: 0, totalQty: 0 };
      variantCostMap.set(vId, {
        totalCost: cur.totalCost + prodCost,
        totalQty: cur.totalQty + cut,
      });
    }
  });

  const getVariantHpp = (variantId?: number | null) => {
    if (variantId && variantCostMap.has(variantId)) {
      const v = variantCostMap.get(variantId)!;
      if (v.totalQty > 0) return Math.round(v.totalCost / v.totalQty);
    }
    return 38000;
  };

  const activeArticle = articles.find(a => a.id === selectedArticleId);
  const activeVariant = activeArticle?.variants?.find((v: any) => v.id === selectedVariantId) || null;
  const activeChannel = channels.find(c => c.id === selectedChannelId);

  const currentAvailableStock = activeVariant
    ? (itemGrade === 'grade_a' ? Number(activeVariant.stock_qty || 0) : Number(activeVariant.stock_reject_qty || 0))
    : 0;

  const isStockInsufficient = qty > currentAvailableStock;
  const totalPrice = qty * unitPrice;

  // Margin estimation for active form
  const activeVariantHpp = getVariantHpp(activeVariant?.id);
  const estimatedUnitMargin = unitPrice > 0 ? unitPrice - activeVariantHpp : 0;
  const estimatedUnitMarginPct = unitPrice > 0 ? Number(((estimatedUnitMargin / unitPrice) * 100).toFixed(1)) : 0;
  const estimatedTotalMargin = estimatedUnitMargin * qty;

  const handleArticleSelect = (id: number) => {
    setSelectedArticleId(id);
    const art = articles.find(a => a.id === id);
    if (art && art.variants && art.variants.length > 0) {
      setSelectedVariantId(art.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !activeVariant || !activeChannel || qty <= 0 || unitPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbSale({
        sale_date: saleDate,
        article_id: activeArticle.id,
        variant_id: activeVariant.id,
        channel_id: activeChannel.id,
        item_grade: itemGrade,
        qty,
        sale_price: unitPrice,
        total_price: totalPrice,
      });

      const gradeLabel = itemGrade === 'grade_a' ? 'Grade A (Bagus)' : 'Barang Reject (Afkir)';
      const lines = [
        `Tanggal: ${saleDate}`,
        `Kategori: ${gradeLabel}`,
        `Produk: ${activeArticle.name} - ${activeVariant.color}`,
        `Channel: ${activeChannel.name}`,
        `Jumlah Terjual: ${qty} pcs`,
        `Harga Satuan: Rp ${unitPrice.toLocaleString('id-ID')}`,
        `Estimasi HPP Satuan: Rp ${activeVariantHpp.toLocaleString('id-ID')}`,
        `Estimasi Margin: ${estimatedUnitMargin >= 0 ? '+' : ''}Rp ${estimatedUnitMargin.toLocaleString('id-ID')} / pcs (${estimatedUnitMarginPct}%)`,
        `Total Pemasukan: Rp ${totalPrice.toLocaleString('id-ID')}`,
        `Total Laba Kotor: Rp ${estimatedTotalMargin.toLocaleString('id-ID')}`,
        `Sisa Stok ${gradeLabel}: ${currentAvailableStock - qty} pcs`,
      ];

      setModalLines(lines);
      setShowModal(true);

      setQty(0);
      setUnitPrice(0);
      await loadData();
    } catch (err: any) {
      alert('Gagal mencatat penjualan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSale) return;
    try {
      await deleteDbSale(deletingSale.id);
      setDeletingSale(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus data penjualan: ' + err.message);
    }
  };

  // Date, Grade & Search Filtering Logic
  const todayStr = getTodayDateString();
  const filteredSales = sales.filter(s => {
    // Search Query
    if (salesSearchQuery) {
      const q = salesSearchQuery.toLowerCase().trim();
      const artName = (s.articles?.name || '').toLowerCase();
      const color = (s.variants?.color || '').toLowerCase();
      const channel = (s.channels?.name || '').toLowerCase();
      if (!artName.includes(q) && !color.includes(q) && !channel.includes(q)) return false;
    }

    // Grade Filter
    if (gradeFilter === 'GRADE_A' && s.item_grade !== 'grade_a') return false;
    if (gradeFilter === 'REJECT' && s.item_grade !== 'reject') return false;

    // Date Filter
    if (dateFilter === 'TODAY') return s.sale_date === todayStr;
    if (dateFilter === '7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(s.sale_date) >= sevenDaysAgo;
    }
    if (dateFilter === '30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(s.sale_date) >= thirtyDaysAgo;
    }
    return true;
  });

  const totalFilteredNominal = filteredSales.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const totalFilteredQty = filteredSales.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div>
      <PageHeader 
        title="Catat Penjualan Produk" 
        description="Pencatatan kas masuk dari transaksi penjualan produk Grade A maupun obral barang reject per channel marketplace" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Omzet Penjualan</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">
            Rp {(sales.reduce((a, b) => a + (b.total_price || 0), 0) / 1000000).toFixed(1)} <span className="text-xs font-normal text-[#5a6270]">Juta</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Pcs Terjual</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">
            {sales.reduce((a, b) => a + (b.qty || 0), 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-[#5a6270]">pcs</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Transaksi</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">
            {sales.length} <span className="text-xs font-normal text-[#5a6270]">Pesanan</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Penjualan Reject</span>
          <p className="text-xl sm:text-2xl font-black text-[#c8a870] font-mono">
            {sales.filter(s => s.item_grade === 'reject').reduce((a, b) => a + (b.qty || 0), 0)} <span className="text-xs font-normal text-[#5a6270]">pcs</span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          {articles.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada artikel produk</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan buat artikel dan varian terlebih dahulu di menu <strong>Master Artikel</strong>.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Step 1: Grade Selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#121822] text-[#7eb3db] font-bold text-xs flex items-center justify-center border border-[#233548]">1</span>
                  <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Kategori Kualitas Barang yang Dijual</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setItemGrade('grade_a');
                      setQty(0);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      itemGrade === 'grade_a'
                        ? 'bg-[#1a2a20] border-[#2a3828] text-[#8ab896] ring-1 ring-[#8ab896]'
                        : 'bg-[#0c0f17] border-[#1e2330] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    <p className="font-bold text-xs sm:text-sm text-[#8ab896]">Baju Jadi Grade A</p>
                    <p className="text-[0.65rem] text-[#5a6270] mt-0.5">Penjualan standar reguler (memotong stok Grade A)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemGrade('reject');
                      setQty(0);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      itemGrade === 'reject'
                        ? 'bg-[#201e1a] border-[#3a3020] text-[#c8a870] ring-1 ring-[#c8a870]'
                        : 'bg-[#0c0f17] border-[#1e2330] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    <p className="font-bold text-xs sm:text-sm text-[#c8a870]">Barang Reject / Cuci Gudang</p>
                    <p className="text-[0.65rem] text-[#5a6270] mt-0.5">Obral cacat produksi (memotong stok Reject)</p>
                  </button>
                </div>
              </div>

              {/* Step 2: Date, Article, Channel */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                    Tanggal Transaksi <span className="text-[#c87070]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                    Pilih Artikel <span className="text-[#c87070]">*</span>
                  </label>
                  <select
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium cursor-pointer"
                    value={selectedArticleId || ''}
                    onChange={(e) => handleArticleSelect(Number(e.target.value))}
                    required
                  >
                    {articles.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                    Channel Penjualan <span className="text-[#c87070]">*</span>
                  </label>
                  <select
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium cursor-pointer"
                    value={selectedChannelId || ''}
                    onChange={(e) => setSelectedChannelId(Number(e.target.value))}
                    required
                  >
                    {channels.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Variant Selection */}
              {activeArticle && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#8899aa]">Pilih Varian Warna</label>
                    <span className="text-[0.7rem] text-[#5a6270]">
                      Stok {itemGrade === 'grade_a' ? 'Grade A' : 'Reject'}: <strong className="text-[#8ab896]">{currentAvailableStock} pcs</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeArticle.variants.map(v => {
                      const avail = itemGrade === 'grade_a' ? v.stock_qty : (v.stock_reject_qty || 0);
                      const isSel = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`p-3 rounded-xl text-left transition-all border ${
                            isSel
                              ? 'bg-[#121822] text-[#e2e6ed] border-[#233548] ring-1 ring-[#7eb3db] shadow-sm'
                              : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{v.color}</p>
                            {isSel && <Check className="w-4 h-4 text-[#7eb3db]" />}
                          </div>
                          <p className="text-[0.65rem] text-[#5a6270] mt-2">
                            Stok: <strong className={avail > 0 ? (itemGrade === 'grade_a' ? 'text-[#8ab896]' : 'text-[#c8a870]') : 'text-[#c87070]'}>{avail} pcs</strong>
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Qty & Price Inputs */}
              {activeVariant && (
                <div className="space-y-4 pt-2 border-t border-[#1e2330]">
                  {isStockInsufficient && (
                    <div className="p-3 bg-[#241a1a] border border-[#3a2020] rounded-xl text-xs text-[#c87070] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Jumlah yang dijual ({qty} pcs) melebihi stok yang tersedia ({currentAvailableStock} pcs).</span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                        Jumlah Terjual (Pcs) <span className="text-[#c87070]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={qty || ''}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full p-2.5 text-lg font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#7eb3db] outline-none font-mono"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                        Harga Jual Satuan per Pcs (Rp) <span className="text-[#c87070]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={unitPrice || ''}
                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                        className="w-full p-2.5 text-lg font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#7eb3db] outline-none font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Real-time Margin & Profit Preview */}
                  {unitPrice > 0 && activeVariant && (
                    <div className="p-3 bg-[#121822] border border-[#233548] rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#8899aa]">
                        <span>HPP Satuan ({activeVariant.color}):</span>
                        <span className="font-mono text-[#e2e6ed]">Rp {activeVariantHpp.toLocaleString('id-ID')} / pcs</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#1e2330]">
                        <span className="font-bold text-[#8899aa]">Estimasi Margin Satuan:</span>
                        <span className={`font-mono font-bold ${estimatedUnitMargin >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}`}>
                          {estimatedUnitMargin >= 0 ? '+' : ''}Rp {estimatedUnitMargin.toLocaleString('id-ID')} ({estimatedUnitMarginPct}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {totalPrice > 0 && (
                    <div className="p-3.5 bg-[#0e1219] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[#8899aa]">Total Pemasukan Kas:</span>
                      <div className="text-right">
                        <span className="text-base font-black text-[#8ab896] block font-mono">Rp {totalPrice.toLocaleString('id-ID')}</span>
                        <span className={`text-[0.65rem] font-mono ${estimatedTotalMargin >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}`}>
                          Estimasi Laba: {estimatedTotalMargin >= 0 ? '+' : ''}Rp {estimatedTotalMargin.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isStockInsufficient}
                    className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Penjualan'}</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Right Column: Riwayat Penjualan */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7eb3db]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Penjualan</h2>
              </div>
              <span className="text-[0.7rem] text-[#8899aa] font-medium">{filteredSales.length} Transaksi</span>
            </div>

            {/* Summary Widget */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Terjual:</span>
                <span className="font-extrabold text-[#e2e6ed] text-xs font-mono">{totalFilteredQty} pcs</span>
              </div>
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Omset:</span>
                <span className="font-extrabold text-[#8ab896] text-xs font-mono">Rp {(totalFilteredNominal / 1000).toFixed(0)}k</span>
              </div>
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Laba Kotor:</span>
                <span className={`font-extrabold font-mono text-xs ${
                  filteredSales.reduce((acc, s) => acc + (s.total_price - (s.qty * getVariantHpp(s.variant_id))), 0) >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'
                }`}>
                  Rp {(filteredSales.reduce((acc, s) => acc + (s.total_price - (s.qty * getVariantHpp(s.variant_id))), 0) / 1000).toFixed(0)}k
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari artikel, warna, atau channel..."
                value={salesSearchQuery}
                onChange={e => setSalesSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => setGradeFilter('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  gradeFilter === 'ALL'
                    ? 'bg-[#3d5a80] text-white'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('GRADE_A')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  gradeFilter === 'GRADE_A'
                    ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3828]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Grade A
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('REJECT')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  gradeFilter === 'REJECT'
                    ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada transaksi penjualan dicatat.
              </div>
            ) : (
              filteredSales.map(s => {
                const saleHpp = getVariantHpp(s.variant_id);
                const saleMargin = (s.unit_price || Math.round(s.total_price / s.qty)) - saleHpp;
                const saleMarginPct = s.unit_price > 0 ? Number(((saleMargin / s.unit_price) * 100).toFixed(1)) : 0;
                return (
                  <div key={s.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#e2e6ed]">{s.articles?.name} - {s.variants?.color}</span>
                      <span className="font-mono text-[#5a6270] text-[0.7rem]">{s.sale_date}</span>
                    </div>

                    <div className="flex items-center justify-between text-[0.7rem]">
                      <span className="text-[#8899aa]">{s.channels?.name} ({s.qty} pcs @ Rp {(s.unit_price || Math.round(s.total_price / s.qty)).toLocaleString('id-ID')})</span>
                      <span className="font-bold text-[#8ab896] font-mono">Rp {(s.total_price || 0).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex items-center justify-between bg-[#0c0f17] p-1.5 rounded-lg text-[0.65rem] border border-[#1e2330]">
                      <span className="text-[#8899aa]">
                        HPP: <strong className="text-[#e2e6ed]">Rp {saleHpp.toLocaleString('id-ID')}</strong>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                        saleMargin >= 0 
                          ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30]' 
                          : 'bg-[#2a1a1a] text-[#c87070] border border-[#3a2020]'
                      }`}>
                        Margin: {saleMargin >= 0 ? '+' : ''}Rp {saleMargin.toLocaleString('id-ID')}/pcs ({saleMarginPct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[0.65rem] pt-1">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        s.item_grade === 'grade_a' ? 'bg-[#1a2a20] text-[#8ab896]' : 'bg-[#201e1a] text-[#c8a870]'
                      }`}>
                        {s.item_grade === 'grade_a' ? 'Grade A' : 'Reject'}
                      </span>
                      <button
                        onClick={() => setDeletingSale(s)}
                        className="text-[#c87070] hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingSale)}
        title="Hapus Data Penjualan"
        message={`Apakah Anda yakin ingin menghapus catatan penjualan #${deletingSale?.id}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingSale(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Penjualan Berhasil Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
