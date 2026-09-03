'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Pagination from "@/components/ui/Pagination";
import MobileStickyFooter from "@/components/ui/MobileStickyFooter";
import DateFilterGroup from "@/components/ui/DateFilterGroup";
import BaseModal from "@/components/ui/BaseModal";
import KpiStatCard from "@/components/ui/KpiStatCard";
import SearchInput from "@/components/ui/SearchInput";
import QuickSuccessAlert from "@/components/ui/QuickSuccessAlert";
import { usePagination } from "@/hooks/usePagination";
import { formatRupiah, formatCompactRupiah, formatNumber } from "@/lib/utils/formatters";
import { getTodayDateString, filterByDateRange, DateFilterOption } from "@/lib/utils/date";
import { 
  getDbArticles, 
  getDbChannels, 
  getDbSales, 
  getDbProductionBatches,
  createDbSale, 
  updateDbSale, 
  deleteDbSale 
} from "@/lib/services/db";
import { 
  Store, 
  AlertTriangle, 
  Clock, 
  Check, 
  Trash2, 
  Pencil, 
  DollarSign, 
  Tag, 
  Plus, 
  ShoppingBag, 
  TrendingUp, 
  Search,
  X 
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

type GradeFilterOption = 'ALL' | 'GRADE_A' | 'REJECT';

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
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [saleDate, setSaleDate] = useState<string>(getTodayDateString());

  // Edit Sale State
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [editArticleId, setEditArticleId] = useState<number | null>(null);
  const [editVariantId, setEditVariantId] = useState<number | null>(null);
  const [editChannelId, setEditChannelId] = useState<number | null>(null);
  const [editItemGrade, setEditItemGrade] = useState<'grade_a' | 'reject'>('grade_a');
  const [editQty, setEditQty] = useState<number>(0);
  const [editUnitPrice, setEditUnitPrice] = useState<number>(0);
  const [editSaleDate, setEditSaleDate] = useState<string>(getTodayDateString());

  // Filters
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
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

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

  const activeArticle = articles.find(a => a.id === selectedArticleId);
  const activeVariant = activeArticle?.variants?.find(v => v.id === selectedVariantId);
  const activeChannel = channels.find(c => c.id === selectedChannelId);

  // Available stock based on grade
  const availableStock = activeVariant
    ? (itemGrade === 'grade_a' ? activeVariant.stock_qty : activeVariant.stock_reject_qty)
    : 0;

  // HPP Calculation per Variant
  const getVariantHpp = (variantId: number): number => {
    const variantBatches = batches.filter(b => b.variant_id === variantId);
    if (!variantBatches.length) return 0;
    const totalCost = variantBatches.reduce((sum, b) => sum + (b.total_batch_cost || 0), 0);
    const totalGood = variantBatches.reduce((sum, b) => sum + (b.qty_produced || 0), 0);
    return totalGood > 0 ? totalCost / totalGood : 0;
  };

  const currentHpp = activeVariant ? getVariantHpp(activeVariant.id) : 0;
  const totalPrice = qty * unitPrice;
  const estimatedTotalCost = itemGrade === 'grade_a' ? qty * currentHpp : 0;
  const estimatedGrossProfit = totalPrice - estimatedTotalCost;
  const estimatedUnitMargin = itemGrade === 'grade_a' ? unitPrice - currentHpp : unitPrice;
  const estimatedUnitMarginPct = unitPrice > 0 ? Number(((estimatedUnitMargin / unitPrice) * 100).toFixed(1)) : 0;

  const handleArticleChange = (articleId: number) => {
    setSelectedArticleId(articleId);
    const art = articles.find(a => a.id === articleId);
    if (art && art.variants && art.variants.length > 0) {
      setSelectedVariantId(art.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const handleSubmit = async (continueEntry: boolean = false) => {
    if (!selectedArticleId || !selectedVariantId || !selectedChannelId || qty <= 0 || unitPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbSale({
        article_id: selectedArticleId,
        variant_id: selectedVariantId,
        channel_id: selectedChannelId,
        item_grade: itemGrade,
        qty,
        sale_price: unitPrice,
        sale_date: saleDate,
      });

      const lines = [
        `Tanggal: ${saleDate}`,
        `Produk: ${activeArticle?.name} - ${activeVariant?.color}`,
        `Kualitas: ${itemGrade === 'grade_a' ? 'Grade A (Bagus)' : 'Reject (Obral)'}`,
        `Channel: ${activeChannel?.name}`,
        `Jumlah: ${qty} pcs @ ${formatRupiah(unitPrice)}`,
        `Total Omset: ${formatRupiah(totalPrice)}`,
        itemGrade === 'grade_a' && currentHpp > 0 ? `Est. Laba Kotor: ${formatRupiah(estimatedGrossProfit)} (${estimatedUnitMarginPct}%)` : 'Stok gudang otomatis berkurang.',
      ];

      if (continueEntry) {
        setQuickSuccessMsg(`Penjualan berhasil dicatat: ${activeArticle?.name} (${activeVariant?.color}) ${qty} pcs - ${formatRupiah(totalPrice)}`);
        setTimeout(() => setQuickSuccessMsg(null), 4000);
      } else {
        setModalLines(lines);
        setShowModal(true);
      }

      setQty(0);
      setUnitPrice(0);
      await loadData();
    } catch (err: any) {
      console.error('Failed to create sale:', err);
      alert(err.message || 'Gagal menyimpan transaksi penjualan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditSale = (s: SaleRecord) => {
    setEditingSale(s);
    setEditArticleId(s.article_id);
    setEditVariantId(s.variant_id);
    setEditChannelId(s.channel_id);
    setEditItemGrade(s.item_grade);
    setEditQty(s.qty);
    setEditUnitPrice(s.unit_price);
    setEditSaleDate(s.sale_date);
  };

  const handleSaveEditSale = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingSale || editQty <= 0 || editUnitPrice <= 0 || !editChannelId) return;

    setIsSubmitting(true);
    try {
      await updateDbSale(editingSale.id, {
        variant_id: editingSale.variant_id,
        channel_id: editChannelId,
        item_grade: editItemGrade,
        qty: editQty,
        sale_price: editUnitPrice,
        sale_date: editSaleDate,
      });

      setEditingSale(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to update sale:', err);
      alert(err.message || 'Gagal memperbarui transaksi penjualan.');
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
    } catch (err) {
      console.error('Failed to delete sale:', err);
      alert('Gagal menghapus catatan penjualan.');
    }
  };

  // Filtered Sales Calculation
  const filteredSales = useMemo(() => {
    let result = filterByDateRange(sales, 'sale_date', dateFilter, customStartDate, customEndDate);
    if (gradeFilter === 'GRADE_A') {
      result = result.filter(s => s.item_grade === 'grade_a');
    } else if (gradeFilter === 'REJECT') {
      result = result.filter(s => s.item_grade === 'reject');
    }
    if (salesSearchQuery.trim()) {
      const q = salesSearchQuery.toLowerCase();
      result = result.filter(s => 
        (s.articles?.name && s.articles.name.toLowerCase().includes(q)) ||
        (s.variants?.color && s.variants.color.toLowerCase().includes(q)) ||
        (s.channels?.name && s.channels.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [sales, dateFilter, customStartDate, customEndDate, gradeFilter, salesSearchQuery]);

  const totalFilteredNominal = filteredSales.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const totalFilteredQty = filteredSales.reduce((acc, curr) => acc + curr.qty, 0);
  const totalAllRevenue = sales.reduce((a, b) => a + (b.total_price || 0), 0);
  const totalAllPcs = sales.reduce((a, b) => a + (b.qty || 0), 0);
  const totalRejectPcs = sales.filter(s => s.item_grade === 'reject').reduce((a, b) => a + (b.qty || 0), 0);

  // Pagination Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: pagedSales,
  } = usePagination(filteredSales, { initialPageSize: 10 });

  return (
    <div>
      <PageHeader 
        title="Catat Penjualan Produk" 
        description="Pencatatan kas masuk dari transaksi penjualan produk Grade A maupun obral barang reject per channel marketplace" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiStatCard
          title="Total Omzet Penjualan"
          value={<span className="text-[#8ab896]">{formatCompactRupiah(totalAllRevenue)}</span>}
          icon={DollarSign}
          iconColor="text-[#8ab896]"
          iconBg="bg-[#1a2a20]"
          iconBorder="border-[#2a3a30]"
        />
        <KpiStatCard
          title="Total Pcs Terjual"
          value={<span className="text-[#7eb3db]">{formatNumber(totalAllPcs)} <span className="text-xs font-normal text-[#5a6270]">pcs</span></span>}
          icon={ShoppingBag}
          iconColor="text-[#7eb3db]"
        />
        <KpiStatCard
          title="Total Transaksi"
          value={<span className="text-[#e2e6ed]">{sales.length} <span className="text-xs font-normal text-[#5a6270]">Pesanan</span></span>}
          icon={Clock}
          iconColor="text-[#e2e6ed]"
        />
        <KpiStatCard
          title="Penjualan Reject"
          value={<span className="text-[#c8a870]">{totalRejectPcs} <span className="text-xs font-normal text-[#5a6270]">pcs</span></span>}
          icon={Tag}
          iconColor="text-[#c8a870]"
          iconBg="bg-[#201e1a]"
          iconBorder="border-[#3a3020]"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          <QuickSuccessAlert
            message={quickSuccessMsg}
            onClose={() => setQuickSuccessMsg(null)}
            icon={Check}
          />

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
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
              {/* Quality Grade Switcher */}
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                  1. Kualitas Barang Terjual <span className="text-[#c87070]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemGrade('grade_a')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      itemGrade === 'grade_a'
                        ? 'bg-[#162a20] border-[#2a4030] text-[#8ab896] shadow-sm'
                        : 'bg-[#0c0f17] border-[#1e2330] text-[#8899aa] hover:border-[#2a3848]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Grade A (Barang Bagus)</span>
                      {itemGrade === 'grade_a' && <span className="w-2 h-2 rounded-full bg-[#8ab896]" />}
                    </div>
                    <p className="text-[0.65rem] text-[#5a6270]">Penjualan reguler harga standar toko</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemGrade('reject')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      itemGrade === 'reject'
                        ? 'bg-[#201e1a] border-[#3a3020] text-[#c8a870] shadow-sm'
                        : 'bg-[#0c0f17] border-[#1e2330] text-[#8899aa] hover:border-[#2a3848]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Reject (Barang Afkir / Cacat)</span>
                      {itemGrade === 'reject' && <span className="w-2 h-2 rounded-full bg-[#c8a870]" />}
                    </div>
                    <p className="text-[0.65rem] text-[#5a6270]">Obral / cuci gudang recovery modal kain</p>
                  </button>
                </div>
              </div>

              {/* Step 2: Select Article & Variant */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider">
                      2. Pilih Artikel Model <span className="text-[#c87070]">*</span>
                    </label>
                    <span className="text-[0.7rem] text-[#7eb3db] font-mono">
                      {articles.length} Model Tersedia
                    </span>
                  </div>

                  {/* Main Dropdown Select (Native Picker on Mobile & Quick Select on Desktop) */}
                  <select
                    value={selectedArticleId || ''}
                    onChange={(e) => handleArticleChange(Number(e.target.value))}
                    className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs sm:text-sm text-[#e2e6ed] font-bold focus:border-[#7eb3db] outline-none cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Model Artikel ({articles.length} Pilihan) --</option>
                    {articles.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.name} ({art.variants?.length || 0} Warna)
                      </option>
                    ))}
                  </select>

                  {/* Search Filter & Quick Chips Grid */}
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={articleSearchQuery}
                        onChange={(e) => setArticleSearchQuery(e.target.value)}
                        placeholder="Ketik untuk filter cepat model baju..."
                        className="w-full pl-9 pr-8 py-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] placeholder-[#5a6270] outline-none focus:border-[#7eb3db]"
                      />
                      {articleSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setArticleSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Wrapped Scrollable Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#0a0d14] rounded-xl border border-[#1e2330]">
                      {articles
                        .filter(a => !articleSearchQuery || a.name.toLowerCase().includes(articleSearchQuery.toLowerCase()))
                        .map((art) => {
                          const isSelected = selectedArticleId === art.id;
                          return (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => handleArticleChange(art.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#3d5a80] text-white shadow-sm font-bold'
                                  : 'bg-[#121620] hover:bg-[#1a2030] text-[#8899aa] hover:text-[#e2e6ed] border border-[#1e2330]'
                              }`}
                            >
                              {art.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {activeArticle && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                      3. Pilih Warna / Varian <span className="text-[#c87070]">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeArticle.variants?.map((v) => {
                        const isSelected = selectedVariantId === v.id;
                        const stock = itemGrade === 'grade_a' ? v.stock_qty : v.stock_reject_qty;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1a2838] border-[#3d5a80] text-[#7eb3db] shadow-sm'
                                : 'bg-[#0c0f17] border-[#1e2330] text-[#8899aa] hover:border-[#2a3848] hover:text-[#e2e6ed]'
                            }`}
                          >
                            <div className="font-semibold truncate mb-0.5">{v.color}</div>
                            <div className="text-[0.65rem] text-[#5a6270] font-mono flex items-center justify-between">
                              <span>Stok:</span>
                              <strong className={stock > 0 ? (itemGrade === 'grade_a' ? 'text-[#8ab896]' : 'text-[#c8a870]') : 'text-[#c87070]'}>
                                {stock} pcs
                              </strong>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Channel & Date */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                    Channel Penjualan <span className="text-[#c87070]">*</span>
                  </label>
                  <select
                    value={selectedChannelId || ''}
                    onChange={(e) => setSelectedChannelId(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db] font-medium cursor-pointer"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                    Tanggal Penjualan <span className="text-[#c87070]">*</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                  />
                </div>
              </div>

              {/* Step 5: Quantity & Price */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block">
                      Jumlah Terjual (pcs) <span className="text-[#c87070]">*</span>
                    </label>
                    <span className="text-[0.65rem] text-[#5a6270]">
                      Sisa Gudang: <strong className={availableStock > 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{availableStock} pcs</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={qty || ''}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-sm font-bold font-mono text-[#8ab896] outline-none focus:border-[#7eb3db]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                    Harga Jual Satuan (Rp) <span className="text-[#c87070]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#5a6270]">Rp</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={unitPrice || ''}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full p-2.5 pl-9 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-sm font-bold font-mono text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Calculation Hub */}
              {activeVariant && (
                <div className="space-y-2">
                  <div className="p-4 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[0.65rem] text-[#8899aa] uppercase tracking-wider block font-bold">Total Omzet Penjualan</span>
                      <span className="text-[0.7rem] text-[#5a6270]">
                        {qty} pcs × {formatRupiah(unitPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-[#8ab896] font-mono">
                        {formatRupiah(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Profit Margin Preview for Grade A */}
                  {itemGrade === 'grade_a' && currentHpp > 0 && unitPrice > 0 && (
                    <div className="p-3 bg-[#121822] border border-[#2a3c50] rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#7eb3db]" />
                        <span className="text-[#8899aa]">
                          HPP Pokok: <strong className="text-[#e2e6ed] font-mono">{formatRupiah(currentHpp)}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold font-mono ${estimatedGrossProfit >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}`}>
                          Margin: {formatRupiah(estimatedUnitMargin)} / pcs ({estimatedUnitMarginPct}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stock Warning */}
                  {qty > availableStock && (
                    <div className="p-3 bg-[#241a1a] border border-[#3a2828] rounded-xl text-xs text-[#c87070] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Jumlah {qty} pcs melebihi stok gudang ({availableStock} pcs). Stok akan menjadi minus.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting || !activeArticle || !activeVariant || !activeChannel || qty <= 0 || unitPrice <= 0}
                      onClick={() => handleSubmit(false)}
                      className="w-full sm:flex-1 py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Lihat Rincian'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !activeArticle || !activeVariant || !activeChannel || qty <= 0 || unitPrice <= 0}
                      onClick={() => handleSubmit(true)}
                      className="w-full sm:w-auto px-5 py-3 bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan & Input Lagi</span>
                    </button>
                  </div>
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
                <span className="font-extrabold text-[#8ab896] text-xs font-mono">{formatCompactRupiah(totalFilteredNominal)}</span>
              </div>
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Laba Kotor:</span>
                <span className={`font-extrabold font-mono text-xs ${
                  filteredSales.reduce((acc, s) => acc + (s.total_price - (s.qty * getVariantHpp(s.variant_id))), 0) >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'
                }`}>
                  {formatCompactRupiah(filteredSales.reduce((acc, s) => acc + (s.total_price - (s.qty * getVariantHpp(s.variant_id))), 0))}
                </span>
              </div>
            </div>

            {/* Search Bar via SearchInput */}
            <SearchInput
              value={salesSearchQuery}
              onChange={setSalesSearchQuery}
              placeholder="Cari artikel, warna, atau channel..."
            />

            {/* Grade Filter Tabs */}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setGradeFilter('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                  gradeFilter === 'ALL'
                    ? 'bg-[#3d5a80] text-white'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa]'
                }`}
              >
                Semua Grade
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('GRADE_A')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                  gradeFilter === 'GRADE_A'
                    ? 'bg-[#162a20] text-[#8ab896] border border-[#2a4030]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa]'
                }`}
              >
                Grade A
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('REJECT')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                  gradeFilter === 'REJECT'
                    ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa]'
                }`}
              >
                Reject
              </button>
            </div>

            {/* Universal Date Filter Tabs */}
            <DateFilterGroup
              value={dateFilter}
              onChange={setDateFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartChange={setCustomStartDate}
              onCustomEndChange={setCustomEndDate}
            />
          </div>

          {/* Sales History Rows */}
          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada transaksi penjualan sesuai filter.
              </div>
            ) : (
              pagedSales.map((s) => {
                const hpp = getVariantHpp(s.variant_id);
                const grossProfit = s.total_price - (s.qty * hpp);
                const marginPct = s.unit_price > 0 ? Number((((s.unit_price - hpp) / s.unit_price) * 100).toFixed(1)) : 0;

                return (
                  <div key={s.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                    <div className="flex items-start justify-between gap-1 text-xs">
                      <div>
                        <span className="font-bold text-[#e2e6ed]">{s.articles?.name}</span>
                        <span className="text-[0.7rem] text-[#8899aa] ml-1.5">({s.variants?.color})</span>
                      </div>
                      <span className="font-mono text-[#5a6270] text-[0.7rem]">{s.sale_date}</span>
                    </div>

                    <div className="flex items-center justify-between text-[0.7rem]">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[0.6rem] font-extrabold uppercase ${
                          s.item_grade === 'grade_a' ? 'bg-[#162a20] text-[#8ab896] border border-[#2a4030]' : 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                        }`}>
                          {s.item_grade === 'grade_a' ? 'Grade A' : 'Reject'}
                        </span>
                        <span className="text-[#7eb3db] font-semibold">🏪 {s.channels?.name}</span>
                      </div>
                      <span className="font-bold text-[#8ab896] font-mono">{formatRupiah(s.total_price)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270] pt-1">
                      <span>{s.qty} pcs @ {formatRupiah(s.unit_price)}</span>
                      {s.item_grade === 'grade_a' && hpp > 0 ? (
                        <span className={grossProfit >= 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>
                          Laba: {formatRupiah(grossProfit)} ({marginPct}%)
                        </span>
                      ) : (
                        <span className="italic">Obral Reject</span>
                      )}
                    </div>

                    <div className="flex justify-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => openEditSale(s)}
                        className="text-[#7eb3db] hover:text-[#9ac4e6] font-semibold text-[0.65rem] px-2 py-0.5 rounded hover:bg-[#1a2838] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSale(s)}
                        className="text-[#c87070] hover:text-[#e07070] font-semibold text-[0.65rem] px-2 py-0.5 rounded hover:bg-[#241a1a] transition-all cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSales.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Edit Sale Modal via BaseModal */}
      <BaseModal
        isOpen={Boolean(editingSale)}
        onClose={() => setEditingSale(null)}
        title={editingSale ? `Edit Catatan Penjualan #${editingSale.id}` : ''}
        icon={Pencil}
      >
        {editingSale && (
          <form className="space-y-3 text-xs" onSubmit={handleSaveEditSale}>
            <div>
              <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                Produk / Varian
              </label>
              <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[#e2e6ed] font-semibold">
                {editingSale.articles?.name} — {editingSale.variants?.color}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                  Channel Penjualan <span className="text-[#c87070]">*</span>
                </label>
                <select
                  required
                  value={editChannelId || ''}
                  onChange={e => setEditChannelId(Number(e.target.value))}
                  className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                >
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                  Kualitas Grade <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={editItemGrade}
                  onChange={e => setEditItemGrade(e.target.value as 'grade_a' | 'reject')}
                  className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                >
                  <option value="grade_a">Grade A (Bagus)</option>
                  <option value="reject">Reject (Afkir)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                Tanggal Penjualan <span className="text-[#c87070]">*</span>
              </label>
              <input
                type="date"
                required
                value={editSaleDate}
                onChange={e => setEditSaleDate(e.target.value)}
                className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                  Jumlah (pcs) <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editQty || ''}
                  onChange={e => setEditQty(Number(e.target.value))}
                  className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl font-mono text-[#8ab896] font-bold outline-none focus:border-[#7eb3db]"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                  Harga Jual Satuan (Rp) <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editUnitPrice || ''}
                  onChange={e => setEditUnitPrice(Number(e.target.value))}
                  className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl font-mono text-[#e2e6ed] font-bold outline-none focus:border-[#7eb3db]"
                />
              </div>
            </div>

            {/* Total Preview */}
            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#8899aa]">Total Penjualan Baru:</span>
              <span className="font-mono font-black text-[#8ab896]">
                {formatRupiah(editQty * editUnitPrice)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSale(null)}
                className="px-3.5 py-2 bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || editQty <= 0 || editUnitPrice <= 0}
                className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </BaseModal>

      {/* Reusable Mobile Sticky Footer */}
      <MobileStickyFooter
        show={Boolean(activeArticle && (qty > 0 || unitPrice > 0))}
        title={activeArticle ? `${activeArticle.name} - ${activeVariant?.color}` : ''}
        subTitle={`${qty} pcs`}
        primaryValue={formatRupiah(totalPrice)}
        valueColor="text-[#8ab896]"
        isSubmitting={isSubmitting}
        disabled={isSubmitting || qty <= 0 || unitPrice <= 0}
        onSubmit={() => handleSubmit(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingSale)}
        title="Hapus Data Penjualan"
        message={`Apakah Anda yakin ingin menghapus catatan penjualan #${deletingSale?.id}? Stok produk akan otomatis dikembalikan ke gudang.`}
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
