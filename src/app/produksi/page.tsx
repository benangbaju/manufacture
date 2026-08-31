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
  variant_id?: number;
  raw_material_id?: number;
  qty_per_piece: number;
  raw_materials?: { id: number; name: string; unit: string; stock_qty: number };
}

interface FabricUsageRow {
  id: string;
  fabric_stock_id: number;
  fabric_used: number;
  unit: 'meter' | 'yard';
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
  fabrics_used_details?: Array<{
    fabric_stock_id: number;
    fabric_name: string;
    unit: string;
    fabric_used: number;
    unit_price: number;
    cost: number;
    is_primary: boolean;
  }>;
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
  
  // Multi-Fabric Rows State
  const [fabricRows, setFabricRows] = useState<FabricUsageRow[]>([
    { id: '1', fabric_stock_id: 0, fabric_used: 0, unit: 'meter' }
  ]);
  
  const [qty, setQty] = useState<number>(0);
  const [qtyReject, setQtyReject] = useState<number>(0);
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
  const [editFabricRows, setEditFabricRows] = useState<FabricUsageRow[]>([]);
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

      const sortedArticles = (artList || []).slice().sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' })
      ).map(a => ({
        ...a,
        variants: (a.variants || []).slice().sort((v1: any, v2: any) => (v1.color || '').localeCompare(v2.color || '', 'id')),
      }));

      const sortedFabrics = (fabList || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'));

      setArticles(sortedArticles);
      setFabrics(sortedFabrics);
      setMappings(mapList || []);
      setRecipes(recList || []);
      setPurchases(purchaseList || []);
      setBatches(batchList || []);

      if (sortedArticles.length > 0 && !selectedArticleId) {
        setSelectedArticleId(sortedArticles[0].id);
        if (sortedArticles[0].variants && sortedArticles[0].variants.length > 0) {
          setSelectedVariantId(sortedArticles[0].variants[0].id);
        }
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

  // Auto select mapped fabrics (supports multiple mapped fabrics) when variant changes
  useEffect(() => {
    if (selectedArticleId && activeVariant && fabrics.length > 0) {
      const variantMappings = mappings.filter(
        m => m.article_id === selectedArticleId && m.variant_color.toLowerCase() === activeVariant.color.toLowerCase()
      );
      if (variantMappings.length > 0) {
        setFabricRows(
          variantMappings.map((m, idx) => ({
            id: String(idx + 1),
            fabric_stock_id: m.fabric_stock_id,
            fabric_used: 0,
            unit: 'meter',
          }))
        );
      } else {
        setFabricRows([
          { id: '1', fabric_stock_id: fabrics[0].id, fabric_used: 0, unit: 'meter' }
        ]);
      }
    }
  }, [selectedArticleId, selectedVariantId, mappings, activeVariant, fabrics]);

  // Fabric Row Operations
  const handleAddFabricRow = () => {
    const nextId = String(Date.now());
    const defaultFabId = fabrics[0]?.id || 0;
    setFabricRows(prev => [...prev, { id: nextId, fabric_stock_id: defaultFabId, fabric_used: 0, unit: 'meter' }]);
  };

  const handleRemoveFabricRow = (id: string) => {
    if (fabricRows.length <= 1) return;
    setFabricRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateFabricRow = (id: string, field: 'fabric_stock_id' | 'fabric_used' | 'unit', val: any) => {
    setFabricRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleAddEditFabricRow = () => {
    const nextId = String(Date.now());
    const defaultFabId = fabrics[0]?.id || 0;
    setEditFabricRows(prev => [...prev, { id: nextId, fabric_stock_id: defaultFabId, fabric_used: 0, unit: 'meter' }]);
  };

  const handleRemoveEditFabricRow = (id: string) => {
    if (editFabricRows.length <= 1) return;
    setEditFabricRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateEditFabricRow = (id: string, field: 'fabric_stock_id' | 'fabric_used' | 'unit', val: any) => {
    setEditFabricRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const totalCutPieces = qty + qtyReject;

  // Analysis of all fabrics used in form
  const fabricRowsAnalysis = fabricRows.map(r => {
    const fab = fabrics.find(f => f.id === r.fabric_stock_id);
    const effectiveMtr = r.unit === 'yard' ? Number((Number(r.fabric_used || 0) * 0.9144).toFixed(2)) : Number(r.fabric_used || 0);
    const fabPurchases = purchases.filter(p => p.item_type === 'fabric' && p.fabric_stock_id === r.fabric_stock_id);
    const totalSpend = fabPurchases.reduce((s, p) => s + (p.total_price || 0), 0);
    const totalQty = fabPurchases.reduce((s, p) => s + (p.qty || 0), 0);
    const avgPrice = totalQty > 0 ? Math.round(totalSpend / totalQty) : 30000;
    const cost = Math.round(effectiveMtr * avgPrice);
    const availableStock = Number(fab?.stock_qty || 0);
    const isShort = effectiveMtr > availableStock;
    return {
      ...r,
      effectiveMtr,
      fabric: fab,
      avgPrice,
      cost,
      availableStock,
      isShort,
    };
  });

  const effectiveFabricUsedTotal = fabricRowsAnalysis.reduce((sum, r) => sum + r.effectiveMtr, 0);
  const estimatedTotalFabricCost = fabricRowsAnalysis.reduce((sum, r) => sum + r.cost, 0);
  const isAnyFabricShort = fabricRowsAnalysis.some(r => r.isShort && r.effectiveMtr > 0);

  // Check Raw Materials in Recipe for the active variant (fallback to article)
  const variantSpecificRecipes = recipes.filter(r => r.variant_id === selectedVariantId);
  const activeRecipes = variantSpecificRecipes.length > 0 
    ? variantSpecificRecipes 
    : recipes.filter(r => r.article_id === selectedArticleId && !r.variant_id);
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

  const currentYield = totalCutPieces > 0 && effectiveFabricUsedTotal > 0 ? (totalCutPieces / effectiveFabricUsedTotal).toFixed(1) : '0.0';
  const totalCost = totalCutPieces * costPerPcs;
  const meterPerPcs = totalCutPieces > 0 && effectiveFabricUsedTotal > 0 ? Number((effectiveFabricUsedTotal / totalCutPieces).toFixed(2)) : 0;
  const estimatedTotalCost = estimatedTotalFabricCost + totalCost;
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
    setEditCostPerPcs(b.cost_per_pcs || 30000);
    setEditIsPaid(b.is_paid || false);
    setEditBatchDate(b.batch_date || getTodayDateString());

    if (b.fabrics_used_details && b.fabrics_used_details.length > 0) {
      setEditFabricRows(
        b.fabrics_used_details.map((f, idx) => ({
          id: String(idx + 1),
          fabric_stock_id: f.fabric_stock_id,
          fabric_used: f.fabric_used,
          unit: 'meter',
        }))
      );
    } else {
      setEditFabricRows([
        { id: '1', fabric_stock_id: b.fabric_stock_id, fabric_used: b.fabric_used, unit: 'meter' }
      ]);
    }
  };

  const handleSaveEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setIsSubmitting(true);
    try {
      const editCut = editQty + editQtyReject;
      const editTotalLabor = editCut * editCostPerPcs;
      const formattedEditFabrics = editFabricRows.map(r => ({
        fabric_stock_id: r.fabric_stock_id,
        fabric_used: r.unit === 'yard' ? Number((Number(r.fabric_used || 0) * 0.9144).toFixed(2)) : Number(r.fabric_used || 0),
      }));

      await updateDbProductionBatch({
        id: editingBatch.id,
        variant_id: editingBatch.variant_id,
        qty_produced: editQty,
        qty_reject: editQtyReject,
        fabrics: formattedEditFabrics,
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
    if (!activeArticle || !activeVariant || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0) return;

    setIsSubmitting(true);
    try {
      const formattedFabrics = fabricRowsAnalysis.map(r => ({
        fabric_stock_id: r.fabric_stock_id,
        fabric_used: r.effectiveMtr,
      }));

      await createDbProductionBatch({
        batch_date: batchDate,
        article_id: activeArticle.id,
        variant_id: activeVariant.id,
        qty_produced: qty,
        qty_reject: qtyReject,
        fabrics: formattedFabrics,
        yield_ratio: Number(currentYield),
        cost_per_pcs: costPerPcs,
        total_sewing_cost: totalCost,
        is_paid: isPaidDirectly,
        paid_date: isPaidDirectly ? batchDate : undefined,
      });

      const fabricSummaryLines = fabricRowsAnalysis.map((r, idx) => 
        `  • ${r.fabric?.name || 'Kain'}: -${r.effectiveMtr} meter (Rp ${r.cost.toLocaleString('id-ID')})`
      );

      const lines = [
        `Produk: ${activeArticle.name} - ${activeVariant.color}`,
        `Stok Grade A (Bagus): +${qty} pcs`,
        qtyReject > 0 ? `Stok Reject (Afkir): +${qtyReject} pcs` : `Tidak ada reject (100% Bagus)`,
        `Total Potongan: ${totalCutPieces} pcs`,
        `Kain Roll Terpotong:`,
        ...fabricSummaryLines,
        `Total Biaya Kain: Rp ${estimatedTotalFabricCost.toLocaleString('id-ID')}`,
        `Ongkos Jahit: Rp ${totalCost.toLocaleString('id-ID')} (${isPaidDirectly ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR'})`,
        `Estimasi HPP Satuan: Rp ${estimatedHppPerPcs.toLocaleString('id-ID')} / pcs`,
        `Efisiensi Yield: ${currentYield} pcs / total meter (${meterPerPcs} m/pcs)`,
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
      setFabricRows(prev => prev.map(r => ({ ...r, fabric_used: 0 })));
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
                  {/* Multi-Fabric Section */}
                  <div className="space-y-3 p-4 bg-[#0c0f17] border border-[#1e2330] rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">
                          Roll Kain Terpakai (Multi-Kain / Kombinasi) <span className="text-[#c87070]">*</span>
                        </label>
                        <p className="text-[0.7rem] text-[#5a6270]">
                          Gunakan 1 jenis kain roll atau kombinasi 2+ kain (misal: Katun Jepang + Poplin)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFabricRow}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#1a2838] hover:bg-[#233548] text-[#7eb3db] border border-[#2a3c50] rounded-xl text-xs font-semibold self-start sm:self-auto transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Kain Kombinasi</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {fabricRowsAnalysis.map((row, idx) => (
                        <div key={row.id} className="p-3 bg-[#0e1219] border border-[#2a3040] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${
                              idx === 0 
                                ? 'bg-[#121822] text-[#7eb3db] border border-[#233548]' 
                                : 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                            }`}>
                              {idx === 0 ? '🧵 Kain Utama' : `🧵 Kain Kombinasi #${idx + 1}`}
                            </span>
                            {fabricRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFabricRow(row.id)}
                                className="text-[#c87070] hover:text-[#e08080] text-xs font-semibold p-1"
                              >
                                ✕ Hapus
                              </button>
                            )}
                          </div>

                          <div className="grid sm:grid-cols-12 gap-2.5 items-center">
                            <div className="sm:col-span-6">
                              <select
                                value={row.fabric_stock_id || ''}
                                onChange={(e) => handleUpdateFabricRow(row.id, 'fabric_stock_id', Number(e.target.value))}
                                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium cursor-pointer"
                                required
                              >
                                {fabrics.map(f => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} (Stok: {Number(f.stock_qty || 0).toFixed(1)} {f.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <input
                                type="number"
                                inputMode="decimal"
                                required
                                min={0.01}
                                step={0.1}
                                placeholder="Meter"
                                value={row.fabric_used || ''}
                                onChange={(e) => handleUpdateFabricRow(row.id, 'fabric_used', Number(e.target.value))}
                                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-center font-mono font-bold text-[#7eb3db] text-xs sm:text-sm focus:border-[#7eb3db] outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3 flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateFabricRow(row.id, 'unit', 'meter')}
                                className={`flex-1 p-2 rounded-xl text-[0.7rem] font-bold border transition-all ${
                                  row.unit === 'meter'
                                    ? 'bg-[#3d5a80] border-[#3d5a80] text-white'
                                    : 'bg-[#0c0f17] border-[#2a3040] text-[#5a6270]'
                                }`}
                              >
                                Meter
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateFabricRow(row.id, 'unit', 'yard')}
                                className={`flex-1 p-2 rounded-xl text-[0.7rem] font-bold border transition-all ${
                                  row.unit === 'yard'
                                    ? 'bg-[#3d5a80] border-[#3d5a80] text-white'
                                    : 'bg-[#0c0f17] border-[#2a3040] text-[#5a6270]'
                                }`}
                              >
                                Yard
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[0.65rem] text-[#8899aa] pt-1">
                            <span>
                              Stok: <strong className={row.availableStock > 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{row.availableStock.toFixed(1)} {row.fabric?.unit || 'meter'}</strong>
                              {row.unit === 'yard' && row.fabric_used > 0 && <span className="text-[#7eb3db] ml-1">(≈ {row.effectiveMtr} meter)</span>}
                            </span>
                            <span className="font-mono text-[#e2e6ed]">
                              Est. Biaya: Rp {row.cost.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {row.isShort && row.effectiveMtr > 0 && (
                            <div className="p-2 bg-[#241a1a] border border-[#3a2020] rounded-lg text-[0.65rem] text-[#c87070] flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Pemakaian {row.effectiveMtr}m melebihi stok gudang ({row.availableStock.toFixed(1)}m).</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {fabricRowsAnalysis.length > 1 && (
                      <div className="p-2.5 bg-[#121822] border border-[#233548] rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-[#8899aa]">Total Pemakaian Semua Kain:</span>
                        <span className="font-bold text-[#7eb3db]">
                          {effectiveFabricUsedTotal.toFixed(1)} meter (Rp {estimatedTotalFabricCost.toLocaleString('id-ID')})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2 Metric Inputs: Grade A vs Reject */}
                  <div className="grid sm:grid-cols-2 gap-3">
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
                  </div>

                  <div className="p-3.5 bg-[#0e1219] border border-[#1e2330] rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <span className="text-[#8899aa]">Total Potongan Fisik: <strong className="text-[#e2e6ed] font-mono">{totalCutPieces} pcs</strong></span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8899aa]">Rasio Yield: <strong className="text-[#7eb3db] font-mono">{currentYield} pcs/m</strong> ({meterPerPcs} m/pcs)</span>
                        {totalCutPieces > 0 && effectiveFabricUsedTotal > 0 && (
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
                        <span>• Estimasi Biaya Semua Kain ({effectiveFabricUsedTotal.toFixed(1)} meter):</span>
                        <span className="font-mono text-[#e2e6ed]">Rp {estimatedTotalFabricCost.toLocaleString('id-ID')}</span>
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
                      disabled={isSubmitting || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0}
                      className="py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Menyimpan...' : `Simpan Batch (+${qty} A, +${qtyReject} Reject)`}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0}
                      onClick={() => handleSubmit(true)}
                      className="py-3 bg-[#1a2838] hover:bg-[#233548] text-[#7eb3db] border border-[#2a3c50] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
                .map(b => {
                  const hasMultiFab = Boolean(b.fabrics_used_details && b.fabrics_used_details.length > 1);
                  return (
                    <div key={b.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-1 text-xs">
                        <span className="font-bold text-[#e2e6ed] break-words leading-snug flex-1 min-w-[140px]">{b.articles?.name} — {b.variants?.color}</span>
                        <span className="font-mono text-[#5a6270] text-[0.7rem] shrink-0">{b.batch_date}</span>
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

                      <div className="bg-[#0c0f17] p-2 rounded-lg text-[0.65rem] border border-[#1e2330] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8899aa]">
                            Total Kain: <strong className="text-[#e2e6ed] font-mono">{b.fabric_used} m</strong> (Rp {(b.fabric_cost || 0).toLocaleString('id-ID')})
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#121822] text-[#7eb3db] border border-[#233548] rounded font-mono font-bold">
                            HPP: Rp {(b.unit_cost || 0).toLocaleString('id-ID')}/pcs
                          </span>
                        </div>
                        {hasMultiFab && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-[#1e2330]">
                            {b.fabrics_used_details?.map((fd, fidx) => (
                              <span key={fidx} className="px-1.5 py-0.5 rounded bg-[#1a2030] text-[#7eb3db] text-[0.6rem] font-mono">
                                🧵 {fd.fabric_name}: {fd.fabric_used}m
                              </span>
                            ))}
                          </div>
                        )}
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
                  );
                })
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
      {activeArticle && (qty > 0 || qtyReject > 0 || effectiveFabricUsedTotal > 0) && (
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
            disabled={isSubmitting || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs rounded-xl shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? '...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* Edit Batch Modal with Multi-Fabric Support */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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

              {/* Edit Multi-Fabric List */}
              <div className="space-y-2 p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#e2e6ed]">Kain Roll yang Terpakai</label>
                  <button
                    type="button"
                    onClick={handleAddEditFabricRow}
                    className="text-[0.65rem] px-2 py-0.5 bg-[#1a2838] text-[#7eb3db] rounded-lg border border-[#2a3c50]"
                  >
                    + Tambah Kain
                  </button>
                </div>

                {editFabricRows.map((ef, idx) => (
                  <div key={ef.id} className="p-2.5 bg-[#0e1219] border border-[#2a3040] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[0.65rem] text-[#8899aa]">
                      <span>{idx === 0 ? '🧵 Kain Utama' : `🧵 Kain Kombinasi #${idx + 1}`}</span>
                      {editFabricRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditFabricRow(ef.id)}
                          className="text-[#c87070] hover:underline"
                        >
                          ✕ Hapus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-8">
                        <select
                          value={ef.fabric_stock_id}
                          onChange={(e) => handleUpdateEditFabricRow(ef.id, 'fabric_stock_id', Number(e.target.value))}
                          className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-xs text-[#e2e6ed]"
                        >
                          {fabrics.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          step={0.1}
                          min={0.1}
                          required
                          value={ef.fabric_used}
                          onChange={(e) => handleUpdateEditFabricRow(ef.id, 'fabric_used', Number(e.target.value))}
                          className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-xs text-center font-mono font-bold text-[#7eb3db]"
                          placeholder="Meter"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                  className="px-4 py-2 bg-[#3d5a80] text-white rounded-xl text-xs font-bold hover:bg-[#4a6d8c] disabled:opacity-50"
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
