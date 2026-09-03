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
  X,
  Plus,
  Coins,
  Scissors,
  Pencil,
  DollarSign,
  PackageCheck,
  Search
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
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>('');
  
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
  
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [pendingPaymentAction, setPendingPaymentAction] = useState<BatchRecord | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<BatchRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editQtyReject, setEditQtyReject] = useState<number>(0);
  const [editFabricRows, setEditFabricRows] = useState<FabricUsageRow[]>([]);
  const [editCostPerPcs, setEditCostPerPcs] = useState<number>(0);
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
  const activeVariant = activeArticle?.variants?.find(v => v.id === selectedVariantId);

  // Auto-fill primary fabric when variant changes
  useEffect(() => {
    if (selectedArticleId && activeVariant && fabrics.length > 0) {
      const variantMappings = mappings.filter(
        m => m.article_id === selectedArticleId && m.variant_color === activeVariant.color
      );

      if (variantMappings.length > 0) {
        const mappedRows: FabricUsageRow[] = variantMappings.map((m, idx) => ({
          id: String(idx + 1),
          fabric_stock_id: m.fabric_stock_id,
          fabric_used: 0,
          unit: 'meter' as const,
        }));
        setFabricRows(mappedRows);
      } else {
        setFabricRows([
          { id: '1', fabric_stock_id: fabrics[0]?.id || 0, fabric_used: 0, unit: 'meter' }
        ]);
      }
    }
  }, [selectedArticleId, selectedVariantId, mappings, fabrics]);

  const handleAddFabricRow = () => {
    setFabricRows(prev => [
      ...prev,
      { id: Date.now().toString(), fabric_stock_id: fabrics[0]?.id || 0, fabric_used: 0, unit: 'meter' }
    ]);
  };

  const handleRemoveFabricRow = (id: string) => {
    if (fabricRows.length <= 1) return;
    setFabricRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateFabricRow = (id: string, field: keyof FabricUsageRow, value: any) => {
    setFabricRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddEditFabricRow = () => {
    setEditFabricRows(prev => [
      ...prev,
      { id: Date.now().toString(), fabric_stock_id: fabrics[0]?.id || 0, fabric_used: 0, unit: 'meter' }
    ]);
  };

  const handleRemoveEditFabricRow = (id: string) => {
    if (editFabricRows.length <= 1) return;
    setEditFabricRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateEditFabricRow = (id: string, field: keyof FabricUsageRow, value: any) => {
    setEditFabricRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const getEstimatedFabricUnitPrice = (fabricId: number): number => {
    const fabPurchases = purchases.filter(p => p.item_type === 'fabric' && p.fabric_stock_id === fabricId);
    if (!fabPurchases.length) return 0;
    const totalCost = fabPurchases.reduce((acc, p) => acc + (p.qty * p.unit_price), 0);
    const totalQty = fabPurchases.reduce((acc, p) => acc + p.qty, 0);
    return totalQty > 0 ? totalCost / totalQty : 0;
  };

  const fabricUsageCalculations = fabricRows.map(r => {
    const fab = fabrics.find(f => f.id === r.fabric_stock_id);
    const effectiveMtr = r.unit === 'yard' ? Number((Number(r.fabric_used || 0) * 0.9144).toFixed(2)) : Number(r.fabric_used || 0);
    const unitPrice = getEstimatedFabricUnitPrice(r.fabric_stock_id);
    const cost = effectiveMtr * unitPrice;
    const availableStock = fab ? Number(fab.stock_qty || 0) : 0;
    const isOverStock = effectiveMtr > availableStock;
    return { ...r, fabric: fab, effectiveMtr, unitPrice, cost, availableStock, isOverStock };
  });

  const effectiveFabricUsedTotal = fabricUsageCalculations.reduce((sum, r) => sum + r.effectiveMtr, 0);
  const estimatedTotalFabricCost = fabricUsageCalculations.reduce((sum, r) => sum + r.cost, 0);
  const isAnyFabricOverStock = fabricUsageCalculations.some(r => r.isOverStock);

  const totalCutPieces = (Number(qty) || 0) + (Number(qtyReject) || 0);
  const totalCost = totalCutPieces * costPerPcs;
  const currentYield = totalCutPieces > 0 && effectiveFabricUsedTotal > 0 ? (totalCutPieces / effectiveFabricUsedTotal).toFixed(1) : '0.0';
  const meterPerPcs = totalCutPieces > 0 && effectiveFabricUsedTotal > 0 ? Number((effectiveFabricUsedTotal / totalCutPieces).toFixed(2)) : 0;

  // Recipe check
  const activeRecipes = recipes.filter(r => 
    selectedVariantId 
      ? r.variant_id === selectedVariantId 
      : (r.article_id === selectedArticleId && !r.variant_id)
  );

  const recipeMaterialsStatus = activeRecipes.map(r => {
    const raw = r.raw_materials;
    const requiredTotal = (r.qty_per_piece || 0) * totalCutPieces;
    const currentStock = raw ? Number(raw.stock_qty || 0) : 0;
    const isShort = currentStock < requiredTotal;
    return { ...r, requiredTotal, currentStock, isShort };
  });

  const shortMaterials = recipeMaterialsStatus.filter(m => m.isShort);

  const handleArticleChange = (artId: number) => {
    setSelectedArticleId(artId);
    const art = articles.find(a => a.id === artId);
    if (art && art.variants && art.variants.length > 0) {
      setSelectedVariantId(art.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const handleSubmit = async (continueEntry: boolean = false) => {
    if (!selectedArticleId || !selectedVariantId || fabricRows.length === 0 || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0) {
      return;
    }

    const hasZeroFabric = fabricRows.some(r => !r.fabric_stock_id || Number(r.fabric_used) <= 0);
    if (hasZeroFabric) {
      alert('Mohon isi jumlah kain yang digunakan untuk setiap kain yang ditambahkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryFabric = fabricRows[0];
      const payload = {
        article_id: selectedArticleId,
        variant_id: selectedVariantId,
        fabric_stock_id: primaryFabric.fabric_stock_id,
        qty_produced: Number(qty) || 0,
        qty_reject: Number(qtyReject) || 0,
        cost_per_pcs: costPerPcs,
        batch_date: batchDate,
        is_paid: isPaidDirectly,
        fabrics: fabricRows.map(r => ({
          fabric_stock_id: r.fabric_stock_id,
          fabric_used: r.unit === 'yard' ? Number((Number(r.fabric_used || 0) * 0.9144).toFixed(2)) : Number(r.fabric_used || 0),
          unit: r.unit,
        })),
      };

      await createDbProductionBatch(payload);

      const fabricSummaryLines = fabricUsageCalculations.map((f, i) => 
        `Kain #${i + 1}: ${f.fabric?.name || 'Kain'} (${f.fabric_used} ${f.unit}${f.unit === 'yard' ? ` ≈ ${f.effectiveMtr}m` : ''})`
      );

      const lines = [
        `Tanggal: ${batchDate}`,
        `Artikel: ${activeArticle?.name} - ${activeVariant?.color}`,
        `Hasil Bagus (Grade A): +${qty} pcs (Masuk Stok Siap Jual)`,
        qtyReject > 0 ? `Hasil Reject (Afkir): +${qtyReject} pcs (Masuk Stok Reject)` : `Hasil Reject: 0 pcs`,
        `Total Kain: ${effectiveFabricUsedTotal.toFixed(1)} meter`,
        ...fabricSummaryLines,
        `Rasio Yield: ${currentYield} pcs/meter (${meterPerPcs} m/pcs)`,
        `Total Ongkos Jahit: ${formatRupiah(totalCost)} (${isPaidDirectly ? 'Lunas Langsung' : 'Tercatat Hutang Jahit'})`,
      ];

      if (continueEntry) {
        setQuickSuccessMsg(`Batch berhasil disimpan: ${activeArticle?.name} (${activeVariant?.color}) +${qty} Bagus / +${qtyReject} Reject`);
        setTimeout(() => setQuickSuccessMsg(null), 4000);
      } else {
        setModalLines(lines);
        setShowModal(true);
      }

      setQty(0);
      setQtyReject(0);
      await loadData();
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      alert(err.message || 'Gagal menyimpan hasil produksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditBatch = (b: BatchRecord) => {
    setEditingBatch(b);
    setEditQty(b.qty_produced);
    setEditQtyReject(b.qty_reject || 0);
    setEditCostPerPcs(b.cost_per_pcs);
    setEditBatchDate(b.batch_date);

    if (b.fabrics_used_details && b.fabrics_used_details.length > 0) {
      setEditFabricRows(b.fabrics_used_details.map((f, idx) => ({
        id: String(idx + 1),
        fabric_stock_id: f.fabric_stock_id,
        fabric_used: f.fabric_used,
        unit: (f.unit as 'meter' | 'yard') || 'meter',
      })));
    } else {
      setEditFabricRows([{
        id: '1',
        fabric_stock_id: b.fabric_stock_id,
        fabric_used: b.fabric_used,
        unit: 'meter',
      }]);
    }
  };

  const handleSaveEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    setIsSubmitting(true);
    try {
      await updateDbProductionBatch({
        id: editingBatch.id,
        variant_id: editingBatch.variant_id,
        qty_produced: editQty,
        qty_reject: editQtyReject,
        cost_per_pcs: editCostPerPcs,
        production_date: editBatchDate,
        fabrics: editFabricRows.map(r => ({
          fabric_stock_id: r.fabric_stock_id,
          fabric_used: r.unit === 'yard' ? Number((Number(r.fabric_used || 0) * 0.9144).toFixed(2)) : Number(r.fabric_used || 0),
        })),
      });

      setEditingBatch(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to update batch:', err);
      alert(err.message || 'Gagal memperbarui batch produksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPaymentAction = async () => {
    if (!pendingPaymentAction) return;
    try {
      await toggleDbBatchPaid(pendingPaymentAction.id, !pendingPaymentAction.is_paid);
      setPendingPaymentAction(null);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
      alert('Gagal memperbarui status pembayaran.');
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (!deletingBatch) return;
    try {
      await deleteDbProductionBatch(deletingBatch.id);
      setDeletingBatch(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete batch:', err);
      alert('Gagal menghapus batch produksi.');
    }
  };

  // Filtered batches
  const filteredBatches = useMemo(() => {
    let result = filterByDateRange(batches, 'batch_date', dateFilter, customStartDate, customEndDate);
    if (filterPayment === 'UNPAID') {
      result = result.filter(b => !b.is_paid);
    } else if (filterPayment === 'PAID') {
      result = result.filter(b => b.is_paid);
    }
    if (batchSearchQuery.trim()) {
      const q = batchSearchQuery.toLowerCase();
      result = result.filter(b => 
        (b.articles?.name && b.articles.name.toLowerCase().includes(q)) ||
        (b.variants?.color && b.variants.color.toLowerCase().includes(q)) ||
        (b.fabric_stock?.name && b.fabric_stock.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [batches, dateFilter, customStartDate, customEndDate, filterPayment, batchSearchQuery]);

  const unpaidCount = filteredBatches.filter(b => !b.is_paid).length;
  const totalUnpaidNominal = filteredBatches
    .filter(b => !b.is_paid)
    .reduce((acc, curr) => acc + (curr.total_sewing_cost || 0), 0);

  const totalFilteredGoodQty = filteredBatches.reduce((acc, curr) => acc + curr.qty_produced, 0);
  const totalFilteredRejectQty = filteredBatches.reduce((acc, curr) => acc + (curr.qty_reject || 0), 0);
  const totalFilteredCutPieces = totalFilteredGoodQty + totalFilteredRejectQty;

  const totalAllGood = batches.reduce((a, b) => a + (b.qty_produced || 0), 0);
  const totalAllReject = batches.reduce((a, b) => a + (b.qty_reject || 0), 0);
  const totalAllFabricUsed = batches.reduce((a, b) => a + Number(b.fabric_used || 0), 0);
  const totalAllUnpaid = batches.filter(b => !b.is_paid).reduce((a, b) => a + (b.total_sewing_cost || 0), 0);

  // Pagination Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: pagedBatches,
  } = usePagination(filteredBatches, { initialPageSize: 10 });

  const allVariantsRejectList = articles.flatMap(a => 
    (a.variants || []).map(v => ({
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
            className="flex items-center gap-2 px-3.5 py-2 bg-[#201e1a] hover:bg-[#2e261a] border border-[#3a3020] rounded-xl text-xs sm:text-sm text-[#c8a870] font-semibold transition-all shadow-sm group cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-[#b89860]" />
            <span>Inventori Reject ({totalRejectStockAll} pcs)</span>
          </button>
        }
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiStatCard
          title="Total Output Grade A"
          value={<span className="text-[#8ab896]">{formatNumber(totalAllGood)} <span className="text-xs font-normal text-[#5a6270]">pcs</span></span>}
          icon={PackageCheck}
          iconColor="text-[#8ab896]"
          iconBg="bg-[#1a2a20]"
          iconBorder="border-[#2a3a30]"
        />
        <KpiStatCard
          title="Total Output Reject"
          value={<span className="text-[#c8a870]">{formatNumber(totalAllReject)} <span className="text-xs font-normal text-[#5a6270]">pcs</span></span>}
          icon={AlertTriangle}
          iconColor="text-[#c8a870]"
          iconBg="bg-[#201e1a]"
          iconBorder="border-[#3a3020]"
        />
        <KpiStatCard
          title="Kain Terpotong"
          value={<span className="text-[#7eb3db]">{totalAllFabricUsed.toFixed(1)} <span className="text-xs font-normal text-[#5a6270]">meter</span></span>}
          icon={Scissors}
          iconColor="text-[#7eb3db]"
        />
        <KpiStatCard
          title="Hutang Ongkos Jahit"
          value={<span className="text-[#c87070]">{formatCompactRupiah(totalAllUnpaid)}</span>}
          icon={Coins}
          iconColor="text-[#c87070]"
          iconBg="bg-[#241a1a]"
          iconBorder="border-[#3a2828]"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          <QuickSuccessAlert
            message={quickSuccessMsg}
            onClose={() => setQuickSuccessMsg(null)}
            icon={Check}
          />

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
                  <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                    Tanggal Produksi / Selesai Jahit <span className="text-[#c87070]">*</span>
                  </label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                    Status Pembayaran CMT <span className="text-[#c87070]">*</span>
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl">
                    <input
                      type="checkbox"
                      id="isPaidDirectly"
                      checked={isPaidDirectly}
                      onChange={(e) => setIsPaidDirectly(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3d5a80] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isPaidDirectly" className="text-xs text-[#e2e6ed] cursor-pointer">
                      Sudah Dibayar Lunas Langsung ke Penjahit
                    </label>
                  </div>
                </div>
              </div>

              {/* Step 1: Article and Variant Selection */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider">
                      1. Pilih Model Artikel yang Diproduksi <span className="text-[#c87070]">*</span>
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
                      2. Pilih Warna / Varian Jahit <span className="text-[#c87070]">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeArticle.variants?.map((v) => {
                        const isSelected = selectedVariantId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-[#1a2838] border-[#3d5a80] text-[#7eb3db] shadow-sm'
                                : 'bg-[#0c0f17] border-[#1e2330] text-[#8899aa] hover:border-[#2a3848] hover:text-[#e2e6ed]'
                            }`}
                          >
                            <div className="font-semibold text-xs truncate mb-1">{v.color}</div>
                            <div className="text-[0.65rem] text-[#5a6270] font-mono flex items-center justify-between">
                              <span>Stok:</span>
                              <strong className={v.stock_qty > 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{v.stock_qty} pcs</strong>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Multi-Fabric Usage Form */}
              <div className="space-y-3 p-4 bg-[#0c0f17] border border-[#1e2330] rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-[#7eb3db]" />
                      <label className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">
                        3. Konsumsi Kain Roll yang Terpakai <span className="text-[#c87070]">*</span>
                      </label>
                    </div>
                    <p className="text-[0.65rem] text-[#5a6270] mt-0.5">
                      Bisa memasukkan lebih dari 1 kain jika kombinasi warna atau furing
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFabricRow}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1a2838] hover:bg-[#233548] text-[#7eb3db] border border-[#2a3c50] rounded-xl text-xs font-semibold self-start sm:self-auto transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Kain Kombinasi</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {fabricUsageCalculations.map((row, idx) => (
                    <div key={row.id} className="p-3 bg-[#0e1219] border border-[#1e2838] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider">
                          {idx === 0 ? '🧵 Kain Utama (Body)' : `🧵 Kain Tambahan / Variasi #${idx + 1}`}
                        </span>
                        {fabricRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFabricRow(row.id)}
                            className="text-[#c87070] hover:text-[#e07070] text-[0.65rem] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-6">
                          <label className="block text-[0.65rem] text-[#5a6270] mb-1">Pilih Stok Kain Gudang</label>
                          <select
                            value={row.fabric_stock_id}
                            onChange={(e) => handleUpdateFabricRow(row.id, 'fabric_stock_id', Number(e.target.value))}
                            className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] outline-none font-medium cursor-pointer"
                          >
                            <option value={0} disabled>-- Pilih Kain --</option>
                            {fabrics.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} (Stok: {formatNumber(f.stock_qty, 1)} {f.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-6">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[0.65rem] text-[#5a6270]">Jumlah Pemakaian</label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateFabricRow(row.id, 'unit', 'meter')}
                                className={`px-2 py-0.5 rounded text-[0.6rem] font-bold cursor-pointer ${
                                  row.unit === 'meter' ? 'bg-[#3d5a80] text-white' : 'bg-[#121620] text-[#5a6270]'
                                }`}
                              >
                                Meter
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateFabricRow(row.id, 'unit', 'yard')}
                                className={`px-2 py-0.5 rounded text-[0.6rem] font-bold cursor-pointer ${
                                  row.unit === 'yard' ? 'bg-[#3d5a80] text-white' : 'bg-[#121620] text-[#5a6270]'
                                }`}
                              >
                                Yard
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="0.0"
                              value={row.fabric_used || ''}
                              onChange={(e) => handleUpdateFabricRow(row.id, 'fabric_used', Number(e.target.value))}
                              className="w-full p-2 pr-12 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs font-mono text-[#e2e6ed] outline-none focus:border-[#7eb3db] font-bold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5a6270] font-semibold">
                              {row.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[0.65rem] pt-1 text-[#5a6270] border-t border-[#1e2330]">
                        <div>
                          Stok: <strong className={row.availableStock > 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{formatNumber(row.availableStock, 1)} {row.fabric?.unit || 'meter'}</strong>
                          {row.unit === 'yard' && row.fabric_used > 0 && (
                            <span className="ml-2 text-[#7eb3db]">≈ {row.effectiveMtr} meter</span>
                          )}
                        </div>
                        <div>
                          Est. Nilai Kain: <strong className="text-[#e2e6ed] font-mono">{formatRupiah(row.cost)}</strong>
                        </div>
                      </div>

                      {row.isOverStock && (
                        <div className="p-2 bg-[#241a1a] border border-[#3a2828] rounded-lg text-[0.65rem] text-[#c87070] flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Pemakaian {row.effectiveMtr}m melebihi stok gudang ({formatNumber(row.availableStock, 1)}m).</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-[#121620] border border-[#1e2838] rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#8899aa]">Total Konsumsi Semua Kain:</span>
                  <span className="font-mono font-bold text-[#7eb3db]">
                    {effectiveFabricUsedTotal.toFixed(1)} meter ({formatRupiah(estimatedTotalFabricCost)})
                  </span>
                </div>
              </div>

              {/* Step 4: Output Qty and Cost */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider">
                  4. Input Hasil Jadi & Ongkos Jahit <span className="text-[#c87070]">*</span>
                </label>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1">
                    <label className="block text-[0.65rem] font-bold text-[#8ab896] uppercase tracking-wider">
                      Hasil Bagus (Grade A)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={qty || ''}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full p-2 bg-[#121620] border border-[#2a3040] rounded-xl text-base font-bold font-mono text-[#8ab896] outline-none focus:border-[#7eb3db]"
                    />
                    <span className="text-[0.6rem] text-[#5a6270] block">Stok siap jual reguler</span>
                  </div>

                  <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1">
                    <label className="block text-[0.65rem] font-bold text-[#c8a870] uppercase tracking-wider">
                      Hasil Reject (Afkir)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={qtyReject || ''}
                      onChange={(e) => setQtyReject(Number(e.target.value))}
                      className="w-full p-2 bg-[#121620] border border-[#2a3040] rounded-xl text-base font-bold font-mono text-[#c8a870] outline-none focus:border-[#7eb3db]"
                    />
                    <span className="text-[0.6rem] text-[#5a6270] block">Barang cacat / obral</span>
                  </div>

                  <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1">
                    <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider">
                      Ongkos Jahit / pcs
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="30000"
                      value={costPerPcs || ''}
                      onChange={(e) => setCostPerPcs(Number(e.target.value))}
                      className="w-full p-2 bg-[#121620] border border-[#2a3040] rounded-xl text-base font-bold font-mono text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                    />
                    <span className="text-[0.6rem] text-[#5a6270] block">Tarif potong jahit per potong</span>
                  </div>
                </div>
              </div>

              {/* Recipe Requirements Preview */}
              {activeRecipes.length > 0 && totalCutPieces > 0 && (
                <div className="p-4 bg-[#0c0f17] border border-[#1e2330] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#e2e6ed]">Resep Bahan Baku Otomatis Terpotong ({totalCutPieces} pcs):</span>
                    <span className="text-[0.65rem] text-[#8899aa]">{activeRecipes.length} Komponen BOM</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {recipeMaterialsStatus.map((rm) => (
                      <div key={rm.id} className="p-2 bg-[#121620] border border-[#1e2838] rounded-xl text-xs space-y-0.5">
                        <div className="font-semibold text-[#e2e6ed] truncate">{rm.raw_materials?.name}</div>
                        <div className="text-[0.65rem] text-[#8899aa]">
                          Dibutuhkan: <strong className="text-[#e2e6ed]">{rm.requiredTotal} {rm.raw_materials?.unit}</strong>
                        </div>
                        <div className="text-[0.6rem] text-[#5a6270]">
                          Sisa: <span className={rm.isShort ? 'text-[#c87070]' : 'text-[#8ab896]'}>{rm.currentStock} {rm.raw_materials?.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {shortMaterials.length > 0 && (
                    <div className="p-2.5 bg-[#241a1a] border border-[#3a2828] rounded-xl text-xs text-[#c87070] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Sebagian aksesoris tidak cukup di gudang. Stok akan tercatat minus jika dilanjutkan.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Live Summary Hub */}
              {activeArticle && totalCutPieces > 0 && (
                <div className="space-y-2">
                  <div className="p-4 bg-[#121822] border border-[#2a3c50] rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1e2a38]">
                      <span className="font-bold text-[#e2e6ed]">Ringkasan Efisiensi Batch:</span>
                      <span className="text-[#8ab896] font-bold">Rasio: {currentYield} pcs/m</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.7rem] text-[#8899aa]">
                      <div>
                        Total Potong: <strong className="text-[#e2e6ed]">{totalCutPieces} pcs</strong>
                      </div>
                      <div>
                        Reject Rate: <strong className={qtyReject > 0 ? 'text-[#c8a870]' : 'text-[#8ab896]'}>{((qtyReject / totalCutPieces) * 100).toFixed(1)}%</strong>
                      </div>
                      <div>
                        Konsumsi: <strong className="text-[#e2e6ed]">{meterPerPcs} m/pcs</strong>
                      </div>
                      <div>
                        Total Ongkos: <strong className="text-[#8ab896] font-mono">{formatRupiah(totalCost)}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1e2a38] flex items-center justify-between text-xs">
                      <span className="text-[#8899aa]">• Estimasi Biaya Semua Kain ({effectiveFabricUsedTotal.toFixed(1)} meter):</span>
                      <span className="font-bold text-[#e2e6ed] font-mono">{formatRupiah(estimatedTotalFabricCost)}</span>
                    </div>
                  </div>

                  {/* Submit Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting || !activeArticle || !activeVariant || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0}
                      onClick={() => handleSubmit(false)}
                      className="w-full sm:flex-1 py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Batch & Lihat Ringkasan'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !activeArticle || !activeVariant || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0}
                      onClick={() => handleSubmit(true)}
                      className="w-full sm:w-auto px-5 py-3 bg-[#1a2838] hover:bg-[#233548] text-[#7eb3db] border border-[#2a3c50] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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

        {/* Right Column: Riwayat Batch */}
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
                <span className="font-extrabold text-[#c87070] text-xs font-mono">{formatRupiah(totalUnpaidNominal)}</span>
              </div>
            </div>

            {/* Batch Search via SearchInput */}
            <SearchInput
              value={batchSearchQuery}
              onChange={setBatchSearchQuery}
              placeholder="Cari artikel, warna, kain..."
            />

            {/* Payment Filter Status Chips */}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setFilterPayment('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                  filterPayment === 'ALL' ? 'bg-[#3d5a80] text-white' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setFilterPayment('UNPAID')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                  filterPayment === 'UNPAID' ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Hutang ({unpaidCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterPayment('PAID')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                  filterPayment === 'PAID' ? 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Lunas
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

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredBatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada data batch produksi sesuai filter.
              </div>
            ) : (
              pagedBatches.map((b) => {
                const totalCut = (b.qty_produced || 0) + (b.qty_reject || 0);
                return (
                  <div key={b.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-1 text-xs">
                      <div>
                        <span className="font-bold text-[#e2e6ed]">{b.articles?.name}</span>
                        <span className="text-[0.7rem] text-[#8899aa] ml-1.5">({b.variants?.color})</span>
                      </div>
                      <span className="font-mono text-[#5a6270] text-[0.7rem]">{b.batch_date}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[0.7rem]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-[#162a20] text-[#8ab896] font-bold border border-[#2a4030]">
                          +{b.qty_produced} pcs Bagus
                        </span>
                        {b.qty_reject > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-[#201e1a] text-[#c8a870] font-bold border border-[#3a3020]">
                            +{b.qty_reject} Reject
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[#e2e6ed] font-mono">
                        {formatRupiah(b.total_sewing_cost)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270] pt-0.5">
                      <span>Kain: {b.fabric_used}m ({b.yield_ratio || '-'} pcs/m)</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPendingPaymentAction(b)}
                          className={`px-2 py-0.5 rounded text-[0.6rem] font-bold border transition-all cursor-pointer ${
                            b.is_paid
                              ? 'bg-[#1a2a20] text-[#6ea87a] border-[#2a3a30] hover:bg-[#203428]'
                              : 'bg-[#201e1a] text-[#c8a870] border-[#3a3020] hover:bg-[#2e261a]'
                          }`}
                        >
                          {b.is_paid ? '✓ Lunas' : 'Belum Lunas'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditBatch(b)}
                          className="text-[#7eb3db] hover:text-[#9ac4e6] font-semibold px-2 py-0.5 rounded hover:bg-[#1a2838] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBatch(b)}
                          className="text-[#c87070] hover:text-[#e07070] font-semibold px-2 py-0.5 rounded hover:bg-[#241a1a] transition-all cursor-pointer"
                        >
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

      {/* Edit Batch Modal via BaseModal */}
      <BaseModal
        isOpen={Boolean(editingBatch)}
        onClose={() => setEditingBatch(null)}
        title={editingBatch ? `Edit Batch #${editingBatch.id} (${editingBatch.articles?.name} - ${editingBatch.variants?.color})` : ''}
        icon={Pencil}
        iconColor="text-[#8ab896]"
      >
        {editingBatch && (
          <form onSubmit={handleSaveEditBatch} className="space-y-4 text-xs">
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
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Hasil Bagus (Grade A)</label>
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
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Hasil Reject</label>
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
                  className="text-[0.65rem] px-2 py-0.5 bg-[#1a2838] text-[#7eb3db] rounded-lg border border-[#2a3c50] cursor-pointer"
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
                        className="text-[#c87070] hover:underline cursor-pointer"
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
                        value={ef.fabric_used}
                        onChange={(e) => handleUpdateEditFabricRow(ef.id, 'fabric_used', Number(e.target.value))}
                        className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-xs text-[#e2e6ed] font-mono"
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
                value={editCostPerPcs}
                onChange={(e) => setEditCostPerPcs(Number(e.target.value))}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] font-mono"
              />
            </div>

            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs flex justify-between">
              <span className="text-[#8899aa]">Total Ongkos Jahit Baru:</span>
              <span className="font-bold text-[#8ab896] font-mono">
                {formatRupiah(((Number(editQty) || 0) + (Number(editQtyReject) || 0)) * editCostPerPcs)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2330]">
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="px-4 py-2 bg-[#1a2030] text-[#8899aa] rounded-xl text-xs font-semibold hover:bg-[#222a3a] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#3d5a80] text-white rounded-xl text-xs font-bold hover:bg-[#4a6d8c] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </BaseModal>

      {/* Reject Inventory Modal via BaseModal */}
      <BaseModal
        isOpen={showRejectInventoryModal}
        onClose={() => setShowRejectInventoryModal(false)}
        title="Inventori Barang Reject (Afkir)"
        icon={AlertTriangle}
        iconColor="text-[#b89860]"
      >
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
            className="px-4 py-2 bg-[#1a2030] text-[#b0b8c4] rounded-xl text-xs font-semibold hover:bg-[#222a3a] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </BaseModal>

      {/* Reusable Mobile Sticky Footer */}
      <MobileStickyFooter
        show={Boolean(activeArticle && (qty > 0 || qtyReject > 0 || effectiveFabricUsedTotal > 0))}
        title={activeArticle ? `${activeArticle.name} - ${activeVariant?.color}` : ''}
        subTitle={`+${qty} Bagus`}
        primaryValue={`Ongkos: ${formatRupiah(totalCost)}`}
        valueColor="text-[#8ab896]"
        isSubmitting={isSubmitting}
        disabled={isSubmitting || totalCutPieces <= 0 || effectiveFabricUsedTotal <= 0}
        onSubmit={() => handleSubmit(false)}
      />

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
