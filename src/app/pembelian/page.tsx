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
import { formatRupiah, formatCompactRupiah } from "@/lib/utils/formatters";
import { getTodayDateString, filterByDateRange, DateFilterOption } from "@/lib/utils/date";
import { 
  getDbFabricStock, 
  getDbRawMaterials, 
  getDbPurchases, 
  createDbPurchase, 
  updateDbPurchase,
  deleteDbPurchase 
} from "@/lib/services/db";
import { 
  PackagePlus, 
  Scissors, 
  Tag, 
  Trash2, 
  Pencil, 
  Clock, 
  Plus, 
  Search, 
  Store, 
  Layers 
} from 'lucide-react';

interface MaterialItem {
  id: number;
  type: 'fabric' | 'raw';
  name: string;
  unit: string;
  currentStock: number;
}

interface PurchaseRecord {
  id: number;
  purchase_date: string;
  item_type: 'raw_material' | 'fabric';
  raw_material_id?: number | null;
  fabric_stock_id?: number | null;
  qty: number;
  unit_price: number;
  supplier?: string;
  raw_materials?: { name: string; unit: string };
  fabric_stock?: { name: string; unit: string };
}

export default function PembelianPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Material selection & search
  const [materialFilterTab, setMaterialFilterTab] = useState<'ALL' | 'FABRIC' | 'RAW'>('ALL');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>(''); // e.g. "fabric-1" or "raw-2"
  const [inputUnit, setInputUnit] = useState<'meter' | 'yard'>('meter');
  const [qty, setQty] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDateString());

  // Edit Purchase States
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editUnitPrice, setEditUnitPrice] = useState<number>(0);
  const [editSupplier, setEditSupplier] = useState<string>('');
  const [editPurchaseDate, setEditPurchaseDate] = useState<string>(getTodayDateString());

  // History Filters
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Modals & State
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fabrics, rawMats, purchaseList] = await Promise.all([
        getDbFabricStock(),
        getDbRawMaterials(),
        getDbPurchases(),
      ]);

      const formattedMaterials: MaterialItem[] = [
        ...fabrics.map((f: any) => ({
          id: f.id,
          type: 'fabric' as const,
          name: f.name,
          unit: f.unit || 'meter',
          currentStock: Number(f.stock_qty || 0),
        })),
        ...rawMats.map((r: any) => ({
          id: r.id,
          type: 'raw' as const,
          name: r.name,
          unit: r.unit || 'pcs',
          currentStock: Number(r.stock_qty || 0),
        })),
      ];

      setMaterials(formattedMaterials);
      setPurchases(purchaseList || []);

      if (!selectedMaterialKey && formattedMaterials.length > 0) {
        setSelectedMaterialKey(`${formattedMaterials[0].type}-${formattedMaterials[0].id}`);
      }
    } catch (err) {
      console.error('Failed to load purchase data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeMat = materials.find(m => `${m.type}-${m.id}` === selectedMaterialKey);
  const isFabric = activeMat?.type === 'fabric';

  const effectiveQty = isFabric && inputUnit === 'yard' ? Number((qty * 0.9144).toFixed(2)) : qty;
  const effectiveUnit = isFabric ? 'meter' : (activeMat?.unit || 'pcs');
  const totalPrice = effectiveQty * unitPrice;

  const handleSavePurchase = async (continueEntry: boolean = false) => {
    if (!activeMat || effectiveQty <= 0 || unitPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbPurchase({
        item_type: activeMat.type === 'fabric' ? 'fabric' : 'raw_material',
        fabric_stock_id: activeMat.type === 'fabric' ? activeMat.id : undefined,
        raw_material_id: activeMat.type === 'raw' ? activeMat.id : undefined,
        qty: effectiveQty,
        unit_price: unitPrice,
        purchase_date: purchaseDate,
        supplier: supplier.trim() || undefined,
      });

      const lines = [
        `Tanggal: ${purchaseDate}`,
        `Bahan: ${activeMat.name} (${activeMat.type === 'fabric' ? 'Kain Roll' : 'Bahan Baku'})`,
        `Jumlah Masuk: +${effectiveQty} ${effectiveUnit} ${isFabric && inputUnit === 'yard' ? `(konversi dari ${qty} yard)` : ''}`,
        `Harga Satuan: ${formatRupiah(unitPrice)} / ${effectiveUnit}`,
        `Total Pengeluaran: ${formatRupiah(totalPrice)}`,
        supplier ? `Supplier: ${supplier}` : `Tanpa Supplier`,
        `Stok fisik gudang otomatis bertambah.`,
      ];

      if (continueEntry) {
        setQuickSuccessMsg(`Berhasil restock ${activeMat.name} (+${effectiveQty} ${effectiveUnit}) - ${formatRupiah(totalPrice)}`);
        setTimeout(() => setQuickSuccessMsg(null), 4000);
      } else {
        setModalLines(lines);
        setShowModal(true);
      }

      setQty(0);
      setUnitPrice(0);
      await loadData();
    } catch (err) {
      console.error('Failed to create purchase:', err);
      alert('Gagal menyimpan data pembelian bahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditPurchase = (p: PurchaseRecord) => {
    setEditingPurchase(p);
    setEditQty(p.qty);
    setEditUnitPrice(p.unit_price);
    setEditSupplier(p.supplier || '');
    setEditPurchaseDate(p.purchase_date);
  };

  const handleSaveEditPurchase = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingPurchase || editQty <= 0 || editUnitPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await updateDbPurchase(editingPurchase.id, {
        item_type: editingPurchase.item_type,
        raw_material_id: editingPurchase.raw_material_id,
        fabric_stock_id: editingPurchase.fabric_stock_id,
        qty: editQty,
        unit_price: editUnitPrice,
        purchase_date: editPurchaseDate,
        supplier: editSupplier.trim() || undefined,
      });

      setEditingPurchase(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update purchase:', err);
      alert('Gagal memperbarui data pembelian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPurchase) return;
    try {
      await deleteDbPurchase(deletingPurchase.id);
      setDeletingPurchase(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete purchase:', err);
      alert('Gagal menghapus data pembelian.');
    }
  };

  // Unique suppliers list
  const existingSuppliers = Array.from(
    new Set(purchases.map(p => p.supplier).filter((s): s is string => Boolean(s && s.trim())))
  );

  // Filtered Materials for Selector
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (materialFilterTab === 'FABRIC' && m.type !== 'fabric') return false;
      if (materialFilterTab === 'RAW' && m.type !== 'raw') return false;
      if (materialSearchQuery.trim()) {
        return m.name.toLowerCase().includes(materialSearchQuery.toLowerCase());
      }
      return true;
    });
  }, [materials, materialFilterTab, materialSearchQuery]);

  // Filtered Purchase History
  const filteredPurchases = useMemo(() => {
    let result = filterByDateRange(purchases, 'purchase_date', dateFilter, customStartDate, customEndDate);
    if (supplierFilter !== 'ALL') {
      result = result.filter(p => p.supplier === supplierFilter);
    }
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      result = result.filter(p => {
        const matName = p.item_type === 'fabric' ? p.fabric_stock?.name : p.raw_materials?.name;
        return (
          (matName && matName.toLowerCase().includes(q)) ||
          (p.supplier && p.supplier.toLowerCase().includes(q))
        );
      });
    }
    return result;
  }, [purchases, dateFilter, customStartDate, customEndDate, supplierFilter, historySearchQuery]);

  const totalFilteredSpending = filteredPurchases.reduce((a, b) => a + (b.qty * b.unit_price), 0);
  const totalAllSpending = purchases.reduce((a, b) => a + (b.qty * b.unit_price), 0);

  // Pagination Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: pagedPurchases,
  } = usePagination(filteredPurchases, { initialPageSize: 10 });

  return (
    <div>
      <PageHeader 
        title="Pembelian & Restock Bahan" 
        description="Catat pembelian kain roll atau bahan baku rasio-tetap untuk menambah stok gudang secara otomatis"
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiStatCard
          title="Total Pengeluaran Belanja"
          value={<span className="text-[#e2e6ed]">{formatCompactRupiah(totalAllSpending)}</span>}
          icon={PackagePlus}
          iconColor="text-[#8ab896]"
          iconBg="bg-[#1a2a20]"
          iconBorder="border-[#2a3a30]"
        />
        <KpiStatCard
          title="Total Transaksi Masuk"
          value={<span className="text-[#7eb3db]">{purchases.length} <span className="text-xs font-normal text-[#5a6270]">Faktur</span></span>}
          icon={Clock}
          iconColor="text-[#7eb3db]"
        />
        <KpiStatCard
          title="Supplier Terdaftar"
          value={<span className="text-[#8ab896]">{existingSuppliers.length} <span className="text-xs font-normal text-[#5a6270]">Vendor</span></span>}
          icon={Store}
          iconColor="text-[#8ab896]"
          iconBg="bg-[#1a2a20]"
          iconBorder="border-[#2a3a30]"
        />
        <KpiStatCard
          title="Pilihan Bahan Tersedia"
          value={<span className="text-[#c8a870]">{materials.length} <span className="text-xs font-normal text-[#5a6270]">SKU Bahan</span></span>}
          icon={Layers}
          iconColor="text-[#c8a870]"
          iconBg="bg-[#201e1a]"
          iconBorder="border-[#3a3020]"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Form Pembelian */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border-[#1e2330]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#8ab896] flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Form Restock Bahan Masuk</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Stok fisik gudang otomatis bertambah setelah disimpan</p>
            </div>
          </div>

          <QuickSuccessAlert
            message={quickSuccessMsg}
            onClose={() => setQuickSuccessMsg(null)}
            icon={PackagePlus}
          />

          <div className="space-y-4">
            {/* Step 1: Material Selection Filter */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block">
                  1. Pilih Bahan yang Ingin Direstock <span className="text-[#c87070]">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMaterialFilterTab('ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                      materialFilterTab === 'ALL'
                        ? 'bg-[#3d5a80] text-white'
                        : 'bg-[#121620] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    Semua ({materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilterTab('FABRIC')}
                    className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                      materialFilterTab === 'FABRIC'
                        ? 'bg-[#3d5a80] text-white'
                        : 'bg-[#121620] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    Kain Roll
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilterTab('RAW')}
                    className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer ${
                      materialFilterTab === 'RAW'
                        ? 'bg-[#3d5a80] text-white'
                        : 'bg-[#121620] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    Bahan Baku
                  </button>
                </div>
              </div>

              {/* Material Search Filter via SearchInput */}
              <SearchInput
                value={materialSearchQuery}
                onChange={setMaterialSearchQuery}
                placeholder="Ketik nama bahan untuk memfilter daftar..."
                className="mb-2"
              />

              {/* Material Chips Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-[#0c0f17] border border-[#1e2330] rounded-xl">
                {filteredMaterials.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-[#5a6270]">
                    Bahan tidak ditemukan.
                  </div>
                ) : (
                  filteredMaterials.map((mat) => {
                    const key = `${mat.type}-${mat.id}`;
                    const isSelected = selectedMaterialKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedMaterialKey(key)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a2838] border-[#3d5a80] text-[#7eb3db] shadow-sm'
                            : 'bg-[#121620] border-[#1e2838] text-[#8899aa] hover:border-[#2a3848] hover:text-[#e2e6ed]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold truncate">{mat.name}</span>
                          <span className={`text-[0.6rem] px-1 py-0.2 rounded font-bold shrink-0 ${
                            mat.type === 'fabric' ? 'bg-[#3d5a80]/20 text-[#7eb3db]' : 'bg-[#1a2030] text-[#8899aa]'
                          }`}>
                            {mat.type === 'fabric' ? 'Kain' : 'Bahan'}
                          </span>
                        </div>
                        <div className="text-[0.65rem] text-[#5a6270] font-mono">
                          Stok: <span className={mat.currentStock > 0 ? 'text-[#8ab896]' : 'text-[#c87070]'}>{mat.currentStock} {mat.unit}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Material Info Badge */}
            {activeMat && (
              <div className="p-3 bg-[#121822] border border-[#2a3c50] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7eb3db]" />
                  <span className="text-[#8899aa]">Bahan Terpilih:</span>
                  <span className="font-bold text-[#e2e6ed]">{activeMat.name}</span>
                </div>
                <div className="text-[0.7rem] text-[#5a6270] font-mono">
                  Sisa Gudang: <strong className="text-[#8ab896]">{activeMat.currentStock} {activeMat.unit}</strong>
                </div>
              </div>
            )}

            {/* Step 2: Detail Pembelian */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                  Tanggal Pembelian <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                  Nama Supplier / Toko (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Bahan Sinar Jaya"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db] placeholder-[#4a5568]"
                />
              </div>
            </div>

            {/* Step 3: Quantity & Price */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block">
                    Jumlah Pembelian <span className="text-[#c87070]">*</span>
                  </label>
                  {isFabric && (
                    <div className="flex items-center gap-1 text-[0.65rem] font-bold">
                      <button
                        type="button"
                        onClick={() => setInputUnit('meter')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          inputUnit === 'meter' ? 'bg-[#3d5a80] text-white' : 'bg-[#121620] text-[#5a6270]'
                        }`}
                      >
                        Meter
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputUnit('yard')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          inputUnit === 'yard' ? 'bg-[#3d5a80] text-white' : 'bg-[#121620] text-[#5a6270]'
                        }`}
                      >
                        Yard
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0"
                    value={qty || ''}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full p-2.5 pr-14 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-sm font-bold font-mono text-[#8ab896] outline-none focus:border-[#7eb3db]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5a6270] font-semibold">
                    {isFabric ? inputUnit : (activeMat?.unit || 'pcs')}
                  </span>
                </div>
                {isFabric && inputUnit === 'yard' && qty > 0 && (
                  <p className="text-[0.65rem] text-[#7eb3db] mt-1">
                    ≈ {effectiveQty} meter (1 yard = 0.9144m)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                  Harga Beli Satuan (Rp) <span className="text-[#c87070]">*</span>
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
            <div className="p-4 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[0.65rem] text-[#8899aa] uppercase tracking-wider block font-bold">Total Pembayaran Bahan</span>
                <span className="text-[0.7rem] text-[#5a6270]">
                  {effectiveQty} {effectiveUnit} × {formatRupiah(unitPrice)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-[#8ab896] font-mono">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting || !activeMat || effectiveQty <= 0 || unitPrice <= 0}
                onClick={() => handleSavePurchase(false)}
                className="w-full sm:flex-1 py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian & Lihat Faktur'}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting || !activeMat || effectiveQty <= 0 || unitPrice <= 0}
                onClick={() => handleSavePurchase(true)}
                className="w-full sm:w-auto px-5 py-3 bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>Simpan & Input Lagi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Riwayat Pembelian */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-[#1e2330] flex flex-col justify-between">
          <div className="space-y-3 mb-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2330]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7eb3db]" />
                <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pembelian</h3>
              </div>
              <span className="text-[0.7rem] text-[#8899aa] font-medium">{filteredPurchases.length} Faktur</span>
            </div>

            {/* Total Filtered Stat Banner */}
            <div className="p-2.5 bg-[#121620] border border-[#1e2838] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Belanja Terfilter:</span>
              <span className="font-extrabold text-[#7eb3db] font-mono">{formatRupiah(totalFilteredSpending)}</span>
            </div>

            {/* History Search with Instant Clear via SearchInput */}
            <SearchInput
              value={historySearchQuery}
              onChange={setHistorySearchQuery}
              placeholder="Cari bahan atau supplier..."
            />

            {/* Supplier Filter */}
            {existingSuppliers.length > 0 && (
              <div>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] outline-none font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Supplier ({existingSuppliers.length})</option>
                  {existingSuppliers.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

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
            {filteredPurchases.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada transaksi pembelian bahan sesuai filter.
              </div>
            ) : (
              pagedPurchases.map(p => {
                const matName = p.item_type === 'fabric' ? p.fabric_stock?.name : p.raw_materials?.name;
                const matUnit = p.item_type === 'fabric' ? (p.fabric_stock?.unit || 'meter') : (p.raw_materials?.unit || 'pcs');
                const totalItemCost = p.qty * p.unit_price;

                return (
                  <div key={p.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-1 text-xs">
                      <span className="font-bold text-[#e2e6ed] break-words leading-snug flex-1 min-w-[140px]">{matName || 'Bahan'}</span>
                      <span className="font-mono text-[#5a6270] text-[0.7rem] shrink-0">{p.purchase_date}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.7rem]">
                      <span className="text-[#8ab896] font-semibold">+{p.qty} {matUnit} @ {formatRupiah(p.unit_price)}</span>
                      <span className="font-bold text-[#e2e6ed] font-mono">{formatRupiah(totalItemCost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270] pt-1">
                      {p.supplier ? (
                        <span className="px-1.5 py-0.5 bg-[#15202b] text-[#7eb3db] border border-[#233548] rounded font-medium">
                          🏪 {p.supplier}
                        </span>
                      ) : (
                        <span className="text-[#5a6270] italic">Tanpa Supplier</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditPurchase(p)}
                          className="text-[#7eb3db] hover:text-[#9ac4e6] font-semibold px-2 py-0.5 rounded hover:bg-[#1a2838] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPurchase(p)}
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
            totalItems={filteredPurchases.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Edit Purchase Modal via BaseModal */}
      <BaseModal
        isOpen={Boolean(editingPurchase)}
        onClose={() => setEditingPurchase(null)}
        title={editingPurchase ? `Edit Catatan Pembelian #${editingPurchase.id}` : ''}
        icon={Pencil}
      >
        {editingPurchase && (
          <form className="space-y-3 text-xs" onSubmit={handleSaveEditPurchase}>
            <div>
              <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                Nama Bahan
              </label>
              <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[#e2e6ed] font-semibold">
                {editingPurchase.item_type === 'fabric' ? editingPurchase.fabric_stock?.name : editingPurchase.raw_materials?.name}
                <span className="ml-2 text-[0.7rem] text-[#5a6270]">
                  ({editingPurchase.item_type === 'fabric' ? editingPurchase.fabric_stock?.unit || 'meter' : editingPurchase.raw_materials?.unit || 'pcs'})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                Tanggal Pembelian <span className="text-[#c87070]">*</span>
              </label>
              <input
                type="date"
                required
                value={editPurchaseDate}
                onChange={e => setEditPurchaseDate(e.target.value)}
                className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                  Jumlah ({editingPurchase.item_type === 'fabric' ? editingPurchase.fabric_stock?.unit || 'meter' : editingPurchase.raw_materials?.unit || 'pcs'}) <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editQty || ''}
                  onChange={e => setEditQty(Number(e.target.value))}
                  className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl font-mono text-[#8ab896] font-bold outline-none focus:border-[#7eb3db]"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                  Harga Satuan (Rp) <span className="text-[#c87070]">*</span>
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

            <div>
              <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
                Supplier / Toko
              </label>
              <input
                type="text"
                placeholder="Contoh: Toko Kain Jaya"
                value={editSupplier}
                onChange={e => setEditSupplier(e.target.value)}
                className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
              />
            </div>

            {/* Edit Total Preview */}
            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#8899aa]">Total Pengeluaran Baru:</span>
              <span className="font-mono font-black text-[#8ab896]">
                {formatRupiah(editQty * editUnitPrice)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
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
        show={Boolean(activeMat && (effectiveQty > 0 || unitPrice > 0))}
        title={activeMat ? activeMat.name : ''}
        subTitle={`+${effectiveQty} ${effectiveUnit}`}
        primaryValue={formatRupiah(totalPrice)}
        valueColor="text-[#8ab896]"
        isSubmitting={isSubmitting}
        disabled={isSubmitting || effectiveQty <= 0 || unitPrice <= 0}
        onSubmit={() => handleSavePurchase(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingPurchase)}
        title="Hapus Catatan Pembelian"
        message={`Apakah Anda yakin ingin menghapus data pembelian bahan ini? Stok gudang akan otomatis dikurangi kembali.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPurchase(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Restock Bahan Berhasil!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
