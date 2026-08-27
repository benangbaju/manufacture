'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { 
  getDbArticles, 
  getDbFabricStock, 
  getDbFabricMappings, 
  getDbRecipes, 
  getDbPurchases,
  getDbProductionBatches, 
  createDbProductionBatch, 
  updateDbProductionBatch,
  toggleDbBatchPaid, 
  deleteDbProductionBatch 
} from "@/lib/services/db";
import { 
  Factory, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Check, 
  CalendarDays,
  X,
  Plus,
  Coins,
  Scissors,
  Pencil
} from 'lucide-react';

interface ArticleItem {
  id: number;
  name: string;
  variants: {
    id: number;
    color: string;
    stock_qty: number;
    stock_reject_qty: number;
  }[];
}

interface FabricItem {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
}

interface MappingItem {
  id: number;
  article_id: number;
  variant_color: string;
  fabric_stock_id: number;
}

interface RecipeItem {
  id: number;
  article_id: number;
  raw_material_id: number;
  qty_per_piece: number;
  raw_materials?: { id: number; name: string; unit: string; stock_qty: number };
}

interface BatchRecord {
  id: number;
  batch_date: string;
  article_id: number;
  variant_id: number;
  fabric_stock_id: number;
  qty_produced: number;
  qty_reject: number;
  total_cut?: number;
  fabric_used: number;
  yield_ratio: number;
  cost_per_pcs: number;
  total_sewing_cost: number;
  fabric_cost?: number;
  accessories_cost?: number;
  total_production_cost?: number;
  unit_cost?: number;
  is_paid: boolean;
  paid_date?: string;
  articles?: { name: string };
  variants?: { color: string };
  fabric_stock?: { name: string; unit: string };
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'CUSTOM';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function ProduksiPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(null);
  
  const [qty, setQty] = useState<number>(0);
  const [qtyReject, setQtyReject] = useState<number>(0);
  const [fabricInputUnit, setFabricInputUnit] = useState<'meter' | 'yard'>('meter');
  const [fabricUsed, setFabricUsed] = useState<number>(0);
  const [costPerPcs, setCostPerPcs] = useState<number>(30000);
  const [isPaidDirectly, setIsPaidDirectly] = useState<boolean>(false);
  const [batchDate, setBatchDate] = useState<string>(getTodayDateString());

  const [showRejectInventoryModal, setShowRejectInventoryModal] = useState(false);
  
  // History & Filter states
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [batchSearchQuery, setBatchSearchQuery] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [pendingPaymentAction, setPendingPaymentAction] = useState<BatchRecord | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<BatchRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

  // Edit Batch States
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editQtyReject, setEditQtyReject] = useState<number>(0);
  const [editFabricUsed, setEditFabricUsed] = useState<number>(0);
  const [editCostPerPcs, setEditCostPerPcs] = useState<number>(30000);
  const [editIsPaid, setEditIsPaid] = useState<boolean>(false);
  const [editBatchDate, setEditBatchDate] = useState<string>(getTodayDateString());

  const loadData = async () => {
    setLoading(true);
    try {
      const [artList, fabList, mapList, recList, purchaseList, batchList] = await Promise.all([
        getDbArticles(),
        getDbFabricStock(),
        getDbFabricMappings(),
        getDbRecipes(),
        getDbPurchases(),
        getDbProductionBatches(),
      ]);

      setArticles(artList || []);
      setFabrics(fabList || []);
      setMappings(mapList || []);
      setRecipes(recList || []);
      setPurchases(purchaseList || []);
      setBatches(batchList || []);

      if (artList && artList.length > 0 && !selectedArticleId) {
        setSelectedArticleId(artList[0].id);
        if (artList[0].variants && artList[0].variants.length > 0) {
          setSelectedVariantId(artList[0].variants[0].id);
        }
      }
      if (fabList && fabList.length > 0 && !selectedFabricId) {
        setSelectedFabricId(fabList[0].id);
      }
    } catch (err) {
      console.error('Failed to load production data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeArticle = articles.find(a => a.id === selectedArticleId);
  const activeVariant = activeArticle?.variants.find(v => v.id === selectedVariantId);
  const activeFabric = fabrics.find(f => f.id === selectedFabricId);

  // Auto select mapped fabric when variant changes
  useEffect(() => {
    if (selectedArticleId && activeVariant) {
      const mapping = mappings.find(
        m => m.article_id === selectedArticleId && m.variant_color.toLowerCase() === activeVariant.color.toLowerCase()
      );
      if (mapping) {
        setSelectedFabricId(mapping.fabric_stock_id);
      }
    }
  }, [selectedArticleId, selectedVariantId, mappings, activeVariant]);

  const effectiveFabricUsed = fabricInputUnit === 'yard' ? Number((fabricUsed * 0.9144).toFixed(2)) : fabricUsed;
  const totalCutPieces = qty + qtyReject;

  // Check Raw Materials in Recipe
  const activeRecipes = recipes.filter(r => r.article_id === selectedArticleId);
  const materialShortages = activeRecipes
    .map(rec => {
      const needed = Number(rec.qty_per_piece || 0) * totalCutPieces;
      const available = Number(rec.raw_materials?.stock_qty || 0);
      return {
        name: rec.raw_materials?.name || 'Bahan',
        unit: rec.raw_materials?.unit || 'pcs',
        needed,
        available,
        isShort: totalCutPieces > 0 && needed > available,
      };
    })
    .filter(m => m.isShort);

  const currentYield = totalCutPieces > 0 && effectiveFabricUsed > 0 ? (totalCutPieces / effectiveFabricUsed).toFixed(1) : '0.0';
  const totalCost = totalCutPieces * costPerPcs;
  const availableFabricStock = Number(activeFabric?.stock_qty || 0);
  const isFabricStockShort = effectiveFabricUsed > availableFabricStock;
  const meterPerPcs = totalCutPieces > 0 && effectiveFabricUsed > 0 ? Number((effectiveFabricUsed / totalCutPieces).toFixed(2)) : 0;

  // Real-time fabric price & estimated HPP calculation for form
  const fabricPurchases = purchases.filter(p => p.item_type === 'fabric' && p.fabric_stock_id === selectedFabricId);
  const totalFabSpend = fabricPurchases.reduce((s, p) => s + (p.total_price || 0), 0);
  const totalFabQty = fabricPurchases.reduce((s, p) => s + (p.qty || 0), 0);
  const avgFabricPrice = totalFabQty > 0 ? Math.round(totalFabSpend / totalFabQty) : 30000;
  const estimatedFabricCost = Math.round(effectiveFabricUsed * avgFabricPrice);
  const estimatedTotalCost = estimatedFabricCost + totalCost;
  const estimatedHppPerPcs = totalCutPieces > 0 ? Math.round(estimatedTotalCost / totalCutPieces) : 0;

  const handleArticleSelect = (id: number) => {
    setSelectedArticleId(id);
    const art = articles.find(a => a.id === id);
    if (art && art.variants && art.variants.length > 0) {
      setSelectedVariantId(art.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const openEditBatch = (b: BatchRecord) => {
    setEditingBatch(b);
    setEditQty(b.qty_produced || 0);
    setEditQtyReject(b.qty_reject || 0);
    setEditFabricUsed(b.fabric_used || 0);
    setEditCostPerPcs(b.cost_per_pcs || 30000);
    setEditIsPaid(b.is_paid || false);
    setEditBatchDate(b.batch_date || getTodayDateString());
  };

  const handleSaveEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setIsSubmitting(true);
    try {
      const editCut = editQty + editQtyReject;
      const editTotalLabor = editCut * editCostPerPcs;
      await updateDbProductionBatch({
        id: editingBatch.id,
        variant_id: editingBatch.variant_id,
        qty_produced: editQty,
        qty_reject: editQtyReject,
        fabric_stock_id: editingBatch.fabric_stock_id,
        fabric_used: editFabricUsed,
        cost_per_pcs: editCostPerPcs,
        total_sewing_cost: editTotalLabor,
        is_paid: editIsPaid,
        production_date: editBatchDate,
      });
      setEditingBatch(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal mengupdate batch: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (continueEntry: boolean = false) => {
    if (!activeArticle || !activeVariant || !activeFabric || totalCutPieces <= 0 || effectiveFabricUsed <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbProductionBatch({
        batch_date: batchDate,
        article_id: activeArticle.id,
        variant_id: activeVariant.id,
        fabric_stock_id: activeFabric.id,
        qty_produced: qty,
        qty_reject: qtyReject,
        fabric_used: effectiveFabricUsed,
        yield_ratio: Number(currentYield),
        cost_per_pcs: costPerPcs,
        total_sewing_cost: totalCost,
        is_paid: isPaidDirectly,
        paid_date: isPaidDirectly ? batchDate : undefined,
      });

      const lines = [
        `Produk: ${activeArticle.name} - ${activeVariant.color}`,
        `Stok Grade A (Bagus): +${qty} pcs`,
        qtyReject > 0 ? `Stok Reject (Afkir): +${qtyReject} pcs` : `Tidak ada reject (100% Bagus)`,
        `Total Potongan: ${totalCutPieces} pcs`,
        `Kain (${activeFabric.name}) terpotong: -${effectiveFabricUsed} meter`,
        `Ongkos Jahit: Rp ${totalCost.toLocaleString('id-ID')} (${isPaidDirectly ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR'})`,
        `Estimasi Biaya Kain: Rp ${estimatedFabricCost.toLocaleString('id-ID')}`,
        `Estimasi HPP Satuan: Rp ${estimatedHppPerPcs.toLocaleString('id-ID')} / pcs`,
        `Efisiensi Yield: ${currentYield} pcs / meter (${meterPerPcs} m/pcs)`,
      ];

      if (continueEntry) {
        setQuickSuccessMsg(`Batch disimpan: +${qty} pcs Bagus, +${qtyReject} pcs Reject (${activeArticle.name} - ${activeVariant.color})`);
        setTimeout(() => setQuickSuccessMsg(null), 4000);
      } else {
        setModalLines(lines);
        setShowModal(true);
      }

      setQty(0);
      setQtyReject(0);
      setFabricUsed(0);
      setIsPaidDirectly(false);
      await loadData();
    } catch (err: any) {
      alert('Gagal mencatat produksi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPaymentAction = async () => {
    if (!pendingPaymentAction) return;
    try {
      await toggleDbBatchPaid(pendingPaymentAction.id, pendingPaymentAction.is_paid);
      setPendingPaymentAction(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal memperbarui status pembayaran: ' + err.message);
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (!deletingBatch) return;
    try {
      await deleteDbProductionBatch(deletingBatch.id);
      setDeletingBatch(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus batch produksi: ' + err.message);
    }
  };

  const todayStr = getTodayDateString();
  const now = new Date();
  const filteredBatches = batches.filter(b => {
    if (filterPayment === 'UNPAID' && b.is_paid) return false;
    if (filterPayment === 'PAID' && !b.is_paid) return false;

    if (batchSearchQuery) {
      const q = batchSearchQuery.toLowerCase().trim();
      const art = (b.articles?.name || '').toLowerCase();
      const col = (b.variants?.color || '').toLowerCase();
      const fab = (b.fabric_stock?.name || '').toLowerCase();
      if (!art.includes(q) && !col.includes(q) && !fab.includes(q)) return false;
    }

    if (dateFilter === 'ALL') return true;
    if (dateFilter === 'TODAY') return b.batch_date === todayStr;
    if (dateFilter === '7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return new Date(b.batch_date) >= sevenDaysAgo;
    }
    if (dateFilter === '30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return new Date(b.batch_date) >= thirtyDaysAgo;
    }
    if (dateFilter === 'THIS_MONTH') {
      const bDate = new Date(b.batch_date);
      return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const bDate = new Date(b.batch_date);
      if (customStartDate && bDate < new Date(customStartDate)) return false;
      if (customEndDate && bDate > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  });

  const unpaidCount = filteredBatches.filter(b => !b.is_paid).length;
  const totalUnpaidNominal = filteredBatches
    .filter(b => !b.is_paid)
    .reduce((acc, curr) => acc + (curr.total_sewing_cost || 0), 0);

  const totalFilteredGoodQty = filteredBatches.reduce((acc, curr) => acc + curr.qty_produced, 0);
  const totalFilteredRejectQty = filteredBatches.reduce((acc, curr) => acc + (curr.qty_reject || 0), 0);
  const totalFilteredCutPieces = totalFilteredGoodQty + totalFilteredRejectQty;

  const allVariantsRejectList = articles.flatMap(a => 
    a.variants.map(v => ({
      articleName: a.name,
      color: v.color,
      stockQty: v.stock_qty,
      rejectStock: v.stock_reject_qty || 0,
    }))
  );
  const totalRejectStockAll = allVariantsRejectList.reduce((acc, curr) => acc + curr.rejectStock, 0);

  return (
    <div>
      <PageHeader 
        title="Catat Hasil Produksi" 
        description="Catat barang jadi (Grade A) & barang reject secara terpisah dengan konsumsi bahan & ongkos potong otomatis"
        action={
          <button
            type="button"
            onClick={() => setShowRejectInventoryModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#201e1a] hover:bg-[#2e261a] border border-[#3a3020] rounded-xl text-xs sm:text-sm text-[#c8a870] font-semibold transition-all shadow-sm group"
          >
            <AlertTriangle className="w-4 h-4 text-[#b89860]" />
            <span>Inventori Reject ({totalRejectStockAll} pcs)</span>
          </button>
        }
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Output Grade A</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">
            {batches.reduce((a, b) => a + (b.qty_produced || 0), 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-[#5a6270]">pcs</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Output Reject</span>
          <p className="text-xl sm:text-2xl font-black text-[#c8a870] font-mono">
            {batches.reduce((a, b) => a + (b.qty_reject || 0), 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-[#5a6270]">pcs</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Kain Terpotong</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">
            {batches.reduce((a, b) => a + Number(b.fabric_used || 0), 0).toFixed(1)} <span className="text-xs font-normal text-[#5a6270]">meter</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Hutang Ongkos Jahit</span>
          <p className="text-xl sm:text-2xl font-black text-[#c87070] font-mono">
            Rp {(batches.filter(b => !b.is_paid).reduce((a, b) => a + (b.total_sewing_cost || 0), 0) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          {quickSuccessMsg && (
            <div className="mb-4 p-3 bg-[#1a2a20] border border-[#2a3a30] text-[#8ab896] rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{quickSuccessMsg}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setQuickSuccessMsg(null)}
                className="text-[#8ab896]/70 hover:text-[#8ab896] text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {articles.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Factory className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada artikel produk</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan buat artikel dan varian terlebih dahulu di menu <strong>Master Artikel</strong>.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-[#121822] text-[#7eb3db] font-bold text-xs flex items-center justify-center border border-[#233548]">1</span>
                    <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Artikel Produk</label>
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-[#121822] text-[#7eb3db] font-bold text-xs flex items-center justify-center border border-[#233548]">2</span>
                    <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tanggal Potong / Batch</label>
                  </div>
                  <input 
                    type="date"
                    required
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium"
                  />
                </div>
              </div>

              {activeArticle && (
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-2">Pilih Varian Warna yang Diproduksi</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeArticle.variants.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-3 rounded-xl text-left transition-all border ${
                          selectedVariantId === v.id 
                            ? 'bg-[#121822] text-[#e2e6ed] border-[#233548] ring-1 ring-[#7eb3db] shadow-sm' 
                            : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{v.color}</p>
                          {selectedVariantId === v.id && <Check className="w-4 h-4 text-[#7eb3db]" />}
                        </div>
                        <div className="flex items-center justify-between text-[0.65rem] text-[#7a8a9a] mt-2 pt-1 border-t border-[#1e2330]">
                          <span>Grade A: <strong className="text-[#8ab896]">{v.stock_qty}</strong></span>
                          <span>Reject: <strong className="text-[#c8a870]">{v.stock_reject_qty || 0}</strong></span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeVariant && (
                <div className="space-y-4 pt-2 border-t border-[#1e2330]">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                          Roll Kain yang Dipotong <span className="text-[#c87070]">*</span>
                        </label>
                        {activeFabric && (
                          <span className="text-[0.65rem] text-[#8899aa] font-mono">
                            Stok: <strong className={availableFabricStock > 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{availableFabricStock.toFixed(1)} {activeFabric.unit}</strong>
                          </span>
                        )}
                      </div>
                      <select
                        value={selectedFabricId || ''}
                        onChange={(e) => setSelectedFabricId(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium cursor-pointer"
                        required
                      >
                        {fabrics.map(f => (
                          <option key={f.id} value={f.id}>{f.name} (Stok: {Number(f.stock_qty || 0).toFixed(1)} {f.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Satuan Input Kain</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFabricInputUnit('meter')}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                            fabricInputUnit === 'meter'
                              ? 'bg-[#3d5a80] border-[#3d5a80] text-white'
                              : 'bg-[#0c0f17] border-[#2a3040] text-[#5a6270]'
                          }`}
                        >
                          Meter
                        </button>
                        <button
                          type="button"
                          onClick={() => setFabricInputUnit('yard')}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                            fabricInputUnit === 'yard'
                              ? 'bg-[#3d5a80] border-[#3d5a80] text-white'
                              : 'bg-[#0c0f17] border-[#2a3040] text-[#5a6270]'
                          }`}
                        >
                          Yard (Konversi)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warning if Fabric is Short */}
                  {isFabricStockShort && effectiveFabricUsed > 0 && (
                    <div className="p-3 bg-[#241a1a] border border-[#3a2020] rounded-xl text-xs text-[#c87070] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Peringatan: Pemakaian kain ({effectiveFabricUsed} meter) melebihi stok fisik gudang ({availableFabricStock.toFixed(1)} meter).
                      </span>
                    </div>
                  )}

                  {/* 3 Metric Inputs */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#0e1219] border border-[#1e2330] rounded-xl">
                      <label className="block text-xs font-bold text-[#8ab896] mb-1.5 text-center">Output Grade A (Pcs) *</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        min={0}
                        placeholder="0"
                        className="w-full p-2.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#8ab896] focus:border-[#7eb3db] outline-none font-mono"
                        value={qty || ''}
                        onChange={(e) => setQty(Number(e.target.value))}
                      />
                      <p className="text-[0.65rem] text-[#5a6270] text-center mt-1">Siap Jual</p>
                    </div>

                    <div className="p-3 bg-[#0e1219] border border-[#1e2330] rounded-xl">
                      <label className="block text-xs font-bold text-[#c8a870] mb-1.5 text-center">Output Reject (Pcs)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        className="w-full p-2.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#c8a870] focus:border-[#7eb3db] outline-none font-mono"
                        value={qtyReject || ''}
                        onChange={(e) => setQtyReject(Number(e.target.value))}
                      />
                      <p className="text-[0.65rem] text-[#5a6270] text-center mt-1">Cacat Produksi</p>
                    </div>

                    <div className="p-3 bg-[#0e1219] border border-[#1e2330] rounded-xl">
                      <label className="block text-xs font-bold text-[#7eb3db] mb-1.5 text-center">Kain ({fabricInputUnit}) *</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        required
                        min={0.1}
                        step={0.1}
                        placeholder="0.0"
                        className="w-full p-2.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#7eb3db] focus:border-[#7eb3db] outline-none font-mono"
                        value={fabricUsed || ''}
                        onChange={(e) => setFabricUsed(Number(e.target.value))}
                      />
                      {fabricInputUnit === 'yard' && fabricUsed > 0 ? (
                        <p className="text-[0.65rem] text-[#7eb3db] text-center mt-1 font-mono">≈ {effectiveFabricUsed} meter</p>
                      ) : (
                        <p className="text-[0.65rem] text-[#5a6270] text-center mt-1">Roll Terpotong</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0e1219] border border-[#1e2330] rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <span className="text-[#8899aa]">Total Potongan Fisik: <strong className="text-[#e2e6ed] font-mono">{totalCutPieces} pcs</strong></span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8899aa]">Rasio: <strong className="text-[#7eb3db] font-mono">{currentYield} pcs/m</strong> ({meterPerPcs} m/pcs)</span>
                        {totalCutPieces > 0 && effectiveFabricUsed > 0 && (
                          <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold ${
                            meterPerPcs <= 1.2 
                              ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30]' 
                              : meterPerPcs <= 1.8 
                                ? 'bg-[#121822] text-[#7eb3db] border border-[#233548]' 
                                : 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                          }`}>
                            {meterPerPcs <= 1.2 ? '✨ Sangat Hemat' : meterPerPcs <= 1.8 ? '✓ Normal' : '⚠️ Cek Pemakaian'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 items-center pt-2 border-t border-[#1e2330]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider">
                            Ongkos Jahit / Pcs (Rp)
                          </label>
                          {costPerPcs > 0 && (
                            <span className="text-[0.65rem] text-[#8ab896] font-mono font-semibold">
                              Rp {costPerPcs.toLocaleString('id-ID')} / pcs
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          required
                          min={0}
                          value={costPerPcs}
                          onChange={(e) => setCostPerPcs(Number(e.target.value))}
                          className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm font-bold font-mono focus:border-[#7eb3db] outline-none"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2.5 cursor-pointer bg-[#0c0f17] p-2.5 rounded-xl border border-[#2a3040] select-none">
                          <input
                            type="checkbox"
                            checked={isPaidDirectly}
                            onChange={(e) => setIsPaidDirectly(e.target.checked)}
                            className="w-4 h-4 rounded text-[#8ab896] bg-[#1a2030] border-[#2a3040] cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-[#b0b8c4]">
                            {isPaidDirectly ? 'Status: Sudah Dibayar Tunai' : 'Status: Belum Dibayar (Hutang)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* HPP & Cost Summary Preview */}
                    <div className="pt-2 border-t border-[#1e2330] space-y-1 text-xs">
                      <div className="flex justify-between text-[#8899aa]">
                        <span>• Estimasi Biaya Kain ({effectiveFabricUsed} m @ Rp {avgFabricPrice.toLocaleString('id-ID')}):</span>
                        <span className="font-mono text-[#e2e6ed]">Rp {estimatedFabricCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[#8899aa]">
                        <span>• Total Ongkos Jahit ({totalCutPieces} pcs @ Rp {costPerPcs.toLocaleString('id-ID')}):</span>
                        <span className="font-mono text-[#8ab896]">Rp {totalCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[#1e2330] font-bold">
                        <span className="text-[#e2e6ed]">Estimasi Total Biaya Batch:</span>
                        <span className="font-mono text-[#e2e6ed]">Rp {estimatedTotalCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-[#121822] border border-[#233548] rounded-xl items-center mt-2">
                        <span className="font-extrabold text-[#7eb3db] text-xs uppercase tracking-wider">Estimasi HPP Satuan:</span>
                        <span className="font-black text-sm sm:text-base font-mono text-[#7eb3db]">
                          Rp {estimatedHppPerPcs.toLocaleString('id-ID')} / pcs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Menyimpan...' : `Simpan Batch (+${qty} A, +${qtyReject} Reject)`}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmit(true)}
                      className="py-3 bg-[#1a2838] hover:bg-[#233548] text-[#7eb3db] border border-[#2a3c50] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
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

        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7eb3db]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Batch</h2>
              </div>
              <span className="text-[0.7rem] text-[#8899aa] font-medium">{filteredBatches.length} Batch</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Total Potong:</span>
                <span className="font-extrabold text-[#e2e6ed] text-xs font-mono">{totalFilteredCutPieces} pcs</span>
              </div>
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Hutang Jahit:</span>
                <span className="font-extrabold text-[#c87070] text-xs font-mono">Rp {totalUnpaidNominal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Batch Search with Instant Clear */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari artikel, warna, kain..."
                value={batchSearchQuery}
                onChange={e => setBatchSearchQuery(e.target.value)}
                className="w-full pl-3 pr-7 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
              {batchSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBatchSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Payment Filter Status Chips */}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setFilterPayment('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  filterPayment === 'ALL' ? 'bg-[#3d5a80] text-white' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setFilterPayment('UNPAID')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  filterPayment === 'UNPAID' ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Hutang ({unpaidCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterPayment('PAID')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  filterPayment === 'PAID' ? 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Lunas
              </button>
            </div>

            {/* Universal Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              {[
                { label: 'Semua', val: 'ALL' as const },
                { label: 'Hari Ini', val: 'TODAY' as const },
                { label: '7 Hari', val: '7_DAYS' as const },
                { label: '30 Hari', val: '30_DAYS' as const },
                { label: 'Bulan Ini', val: 'THIS_MONTH' as const },
                { label: 'Kustom', val: 'CUSTOM' as const },
              ].map(tab => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => setDateFilter(tab.val)}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === tab.val
                      ? 'bg-[#3d5a80] text-white'
                      : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Inputs */}
            {dateFilter === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="text-[0.6rem] text-[#8899aa] uppercase font-bold block mb-0.5">Dari Tanggal</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-xs text-[#e2e6ed] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] text-[#8899aa] uppercase font-bold block mb-0.5">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-xs text-[#e2e6ed] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[440px]">
            {filteredBatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">Belum ada batch dicatat.</div>
            ) : (
              filteredBatches
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map(b => (
                  <div key={b.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#e2e6ed]">{b.articles?.name} - {b.variants?.color}</span>
                      <span className="font-mono text-[#5a6270] text-[0.7rem]">{b.batch_date}</span>
                    </div>

                    <div className="flex items-center justify-between text-[0.7rem]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8ab896] font-semibold">+{b.qty_produced} Bagus</span>
                        {b.qty_reject > 0 && <span className="text-[#c8a870] font-semibold">+{b.qty_reject} Reject</span>}
                      </div>
                      <span className="font-mono text-xs text-[#e2e6ed] font-semibold">
                        Ongkos: Rp {(b.total_sewing_cost || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-[#0c0f17] p-1.5 rounded-lg text-[0.65rem] border border-[#1e2330]">
                      <span className="text-[#8899aa]">
                        Kain: <strong className="text-[#e2e6ed] font-mono">{b.fabric_used} m</strong> (Rp {(b.fabric_cost || 0).toLocaleString('id-ID')})
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#121822] text-[#7eb3db] border border-[#233548] rounded font-mono font-bold">
                        HPP: Rp {(b.unit_cost || 0).toLocaleString('id-ID')}/pcs
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[0.65rem] pt-0.5">
                      <button
                        onClick={() => setPendingPaymentAction(b)}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          b.is_paid ? 'bg-[#1a2a20] text-[#6ea87a]' : 'bg-[#201e1a] text-[#c8a870]'
                        }`}
                      >
                        {b.is_paid ? '✓ Lunas' : '⏳ Belum Lunas'}
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditBatch(b)}
                          className="text-[#8ab896] hover:underline flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => setDeletingBatch(b)} className="text-[#c87070] hover:underline">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredBatches.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Mobile Sticky Floating Summary & Submit Bar */}
      {activeArticle && (qty > 0 || qtyReject > 0 || effectiveFabricUsed > 0) && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-[#121824]/95 backdrop-blur-md border-t border-[#2a3848] p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="min-w-0">
            <span className="text-[0.65rem] text-[#8899aa] block truncate font-medium">
              {activeArticle.name} - {activeVariant?.color} (+{qty} Bagus)
            </span>
            <span className="text-sm font-black text-[#8ab896] font-mono">
              Ongkos: Rp {totalCost.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            type="button"
            disabled={isSubmitting || totalCutPieces <= 0 || effectiveFabricUsed <= 0}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs rounded-xl shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? '...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2330]">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#8ab896]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Batch #{editingBatch.id} ({editingBatch.articles?.name} - {editingBatch.variants?.color})</h3>
              </div>
              <button onClick={() => setEditingBatch(null)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Tanggal Produksi</label>
                <input
                  type="date"
                  required
                  value={editBatchDate}
                  onChange={(e) => setEditBatchDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8ab896] mb-1">Hasil Bagus (Grade A)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs font-bold text-[#8ab896]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#c8a870] mb-1">Hasil Reject</label>
                  <input
                    type="number"
                    min={0}
                    value={editQtyReject}
                    onChange={(e) => setEditQtyReject(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs font-bold text-[#c8a870]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kain Terpakai (Meter)</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    required
                    value={editFabricUsed}
                    onChange={(e) => setEditFabricUsed(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs font-bold text-[#e2e6ed]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Ongkos Jahit / Pcs (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editCostPerPcs}
                    onChange={(e) => setEditCostPerPcs(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs font-bold text-[#e2e6ed]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer bg-[#0c0f17] p-2.5 rounded-xl border border-[#2a3040] select-none">
                <input
                  type="checkbox"
                  checked={editIsPaid}
                  onChange={(e) => setEditIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6ea87a] bg-[#1a2030] border-[#2a3040] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#b0b8c4]">
                  {editIsPaid ? 'Status: Sudah Dibayar Tunai' : 'Status: Belum Dibayar (Hutang)'}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 bg-[#1a2030] text-[#b0b8c4] rounded-xl text-xs font-semibold hover:bg-[#222a3a]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#3d5a80] text-white rounded-xl text-xs font-bold hover:bg-[#b89860] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRejectInventoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2330]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#b89860]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Inventori Barang Reject (Afkir)</h3>
              </div>
              <button onClick={() => setShowRejectInventoryModal(false)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8899aa] mb-3">
              Total ada <strong className="text-[#c8a870]">{totalRejectStockAll} pcs</strong> barang reject di gudang yang siap diobral atau dijual terpisah.
            </p>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-[#1e2330] border border-[#1e2330] rounded-xl mb-4">
              {allVariantsRejectList.filter(v => v.rejectStock > 0).length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5a6270]">Belum ada stok reject tercatat.</div>
              ) : (
                allVariantsRejectList.filter(v => v.rejectStock > 0).map((v, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#e2e6ed]">{v.articleName} - {v.color}</p>
                      <p className="text-[0.65rem] text-[#5a6270]">Grade A: {v.stockQty} pcs</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#201e1a] text-[#c8a870] font-bold border border-[#3a3020]">
                      {v.rejectStock} pcs Reject
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowRejectInventoryModal(false)}
                className="px-4 py-2 bg-[#1a2030] text-[#b0b8c4] rounded-xl text-xs font-semibold hover:bg-[#222a3a]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(pendingPaymentAction)}
        title={pendingPaymentAction?.is_paid ? "Tandai Belum Lunas" : "Tandai Lunas Ongkos Jahit"}
        message={`Ubah status pembayaran batch #${pendingPaymentAction?.id}?`}
        onConfirm={handleConfirmPaymentAction}
        onCancel={() => setPendingPaymentAction(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingBatch)}
        title="Hapus Batch Produksi"
        message={`Apakah Anda yakin ingin menghapus catatan batch #${deletingBatch?.id}?`}
        onConfirm={handleConfirmDeleteBatch}
        onCancel={() => setDeletingBatch(null)}
      />

      <ConfirmModal 
        isOpen={showModal} 
        title="Hasil Produksi Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
