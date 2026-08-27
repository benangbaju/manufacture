'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { 
  getDbFabricStock, 
  getDbRawMaterials, 
  getDbPurchases, 
  createDbPurchase, 
  deleteDbPurchase 
} from "@/lib/services/db";
import { 
  PackagePlus, 
  Scissors, 
  Tag, 
  Trash2, 
  CalendarDays, 
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
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
  qty: number;
  unit_price: number;
  supplier?: string;
  raw_materials?: { name: string; unit: string };
  fabric_stock?: { name: string; unit: string };
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'CUSTOM';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

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

  // History Filters & Pagination
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
        ...(fabrics || []).map(f => ({
          id: f.id,
          type: 'fabric' as const,
          name: f.name,
          unit: f.unit || 'meter',
          currentStock: Number(f.stock_qty || 0),
        })),
        ...(rawMats || []).map(r => ({
          id: r.id,
          type: 'raw' as const,
          name: r.name,
          unit: r.unit || 'pcs',
          currentStock: Number(r.stock_qty || 0),
        })),
      ];

      setMaterials(formattedMaterials);
      setPurchases(purchaseList || []);
      if (formattedMaterials.length > 0 && !selectedMaterialKey) {
        setSelectedMaterialKey(`${formattedMaterials[0].type}-${formattedMaterials[0].id}`);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const existingSuppliers = Array.from(
    new Set(purchases.map(p => p.supplier?.trim()).filter(Boolean))
  ) as string[];

  const [activeType, activeIdStr] = selectedMaterialKey ? selectedMaterialKey.split('-') : ['', ''];
  const activeMat = materials.find(m => m.type === activeType && m.id === Number(activeIdStr));

  // Conversion logic: 1 yard = 0.9144 meter
  const isFabric = activeMat?.type === 'fabric';
  const effectiveQty = isFabric && inputUnit === 'yard' ? Number((qty * 0.9144).toFixed(2)) : qty;
  const effectiveUnit = isFabric ? 'meter' : (activeMat?.unit || 'pcs');
  const totalPrice = qty * unitPrice;

  const handleSavePurchase = async (continueEntry: boolean = false) => {
    if (!activeMat || effectiveQty <= 0 || unitPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbPurchase({
        item_type: activeMat.type === 'fabric' ? 'fabric' : 'raw_material',
        fabric_stock_id: activeMat.type === 'fabric' ? activeMat.id : null,
        raw_material_id: activeMat.type === 'raw' ? activeMat.id : null,
        qty: effectiveQty,
        unit_price: unitPrice,
        supplier: supplier.trim() || undefined,
        purchase_date: purchaseDate,
      });

      const lines = [
        `Tanggal: ${purchaseDate}`,
        `Bahan: ${activeMat.name}`,
        `Jumlah Masuk: +${effectiveQty} ${effectiveUnit}` + (inputUnit === 'yard' ? ` (dari ${qty} yard)` : ''),
        `Harga Satuan: Rp ${unitPrice.toLocaleString('id-ID')}`,
        `Supplier: ${supplier.trim() || 'Tanpa Supplier'}`,
        `Total Pengeluaran: Rp ${totalPrice.toLocaleString('id-ID')}`,
        `Stok di gudang otomatis bertambah.`,
      ];

      if (continueEntry) {
        setQuickSuccessMsg(`Berhasil mencatat: ${activeMat.name} (+${effectiveQty} ${effectiveUnit}) senilai Rp ${totalPrice.toLocaleString('id-ID')}`);
        setTimeout(() => setQuickSuccessMsg(null), 4000);
      } else {
        setModalLines(lines);
        setShowModal(true);
      }

      setQty(0);
      setUnitPrice(0);
      await loadData();
    } catch (err: any) {
      alert('Gagal mencatat pembelian: ' + err.message);
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
    } catch (err: any) {
      alert('Gagal menghapus riwayat pembelian: ' + err.message);
    }
  };

  // Filtered materials for selection
  const filteredMaterials = materials.filter(m => {
    if (materialFilterTab === 'FABRIC' && m.type !== 'fabric') return false;
    if (materialFilterTab === 'RAW' && m.type !== 'raw') return false;
    const q = materialSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.name.toLowerCase().includes(q);
  });

  // Universal Date & Supplier Filtering Logic
  const today = getTodayDateString();
  const now = new Date();
  const filteredPurchases = purchases.filter(p => {
    if (supplierFilter !== 'ALL' && p.supplier !== supplierFilter) return false;

    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase().trim();
      const name = (p.item_type === 'fabric' ? p.fabric_stock?.name : p.raw_materials?.name) || '';
      const supp = p.supplier || '';
      if (!name.toLowerCase().includes(q) && !supp.toLowerCase().includes(q)) return false;
    }

    if (dateFilter === 'ALL') return true;
    if (dateFilter === 'TODAY') return p.purchase_date === today;
    if (dateFilter === '7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return new Date(p.purchase_date) >= sevenDaysAgo;
    }
    if (dateFilter === '30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return new Date(p.purchase_date) >= thirtyDaysAgo;
    }
    if (dateFilter === 'THIS_MONTH') {
      const pDate = new Date(p.purchase_date);
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'CUSTOM') {
      const pDate = new Date(p.purchase_date);
      if (customStartDate && pDate < new Date(customStartDate)) return false;
      if (customEndDate && pDate > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  });

  const totalFilteredSpending = filteredPurchases.reduce((a, b) => a + (b.qty * b.unit_price), 0);
  const totalAllSpending = purchases.reduce((a, b) => a + (b.qty * b.unit_price), 0);

  return (
    <div>
      <PageHeader 
        title="Pembelian & Restock Bahan" 
        description="Catat pembelian kain roll atau bahan baku rasio-tetap untuk menambah stok gudang secara otomatis"
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Pengeluaran Belanja</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">
            Rp {(totalAllSpending / 1000000).toFixed(1)} <span className="text-xs font-normal text-[#5a6270]">Juta</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Transaksi Masuk</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">
            {purchases.length} <span className="text-xs font-normal text-[#5a6270]">Faktur</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Supplier Terdaftar</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">
            {existingSuppliers.length} <span className="text-xs font-normal text-[#5a6270]">Vendor</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Pilihan Bahan Tersedia</span>
          <p className="text-xl sm:text-2xl font-black text-[#c8a870] font-mono">
            {materials.length} <span className="text-xs font-normal text-[#5a6270]">SKU Bahan</span>
          </p>
        </div>
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

          {quickSuccessMsg && (
            <div className="mb-4 p-3 bg-[#1a2a20] border border-[#2a3a30] text-[#8ab896] rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
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

          <form onSubmit={(e) => { e.preventDefault(); handleSavePurchase(false); }} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Tanggal Pembelian <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Nama Supplier / Toko (Opsional)
                </label>
                <input
                  type="text"
                  list="supplier-options"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Contoh: Toko Kain Mitra Jaya..."
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
                />
                <datalist id="supplier-options">
                  {existingSuppliers.map((s, idx) => (
                    <option key={idx} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Material Selection with Category Tabs & Search */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                  Pilih Bahan Baku / Roll Kain <span className="text-[#c87070]">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMaterialFilterTab('ALL')}
                    className={`px-2.5 py-0.5 rounded-lg text-[0.65rem] font-bold transition-all ${
                      materialFilterTab === 'ALL' ? 'bg-[#3d5a80] text-white' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                    }`}
                  >
                    Semua ({materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilterTab('FABRIC')}
                    className={`px-2.5 py-0.5 rounded-lg text-[0.65rem] font-bold transition-all ${
                      materialFilterTab === 'FABRIC' ? 'bg-[#3d5a80] text-white' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                    }`}
                  >
                    Kain Roll
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilterTab('RAW')}
                    className={`px-2.5 py-0.5 rounded-lg text-[0.65rem] font-bold transition-all ${
                      materialFilterTab === 'RAW' ? 'bg-[#3d5a80] text-white' : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                    }`}
                  >
                    Aksesoris BOM
                  </button>
                </div>
              </div>

              {/* Material Search Input */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari bahan..."
                  value={materialSearchQuery}
                  onChange={e => setMaterialSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[170px] overflow-y-auto p-1 bg-[#0c0f17] rounded-xl border border-[#1e2330]">
                {filteredMaterials.length === 0 ? (
                  <div className="col-span-full p-4 text-center text-xs text-[#5a6270]">
                    Tidak ada bahan yang cocok dengan pencarian.
                  </div>
                ) : (
                  filteredMaterials.map(m => {
                    const key = `${m.type}-${m.id}`;
                    const isSelected = selectedMaterialKey === key;
                    const isFab = m.type === 'fabric';
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedMaterialKey(key)}
                        className={`p-2.5 rounded-xl text-left transition-all border ${
                          isSelected 
                            ? 'bg-[#121822] text-[#7eb3db] border-[#233548] ring-1 ring-[#7eb3db]' 
                            : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isFab ? (
                              <Scissors className="w-3 h-3 text-[#7eb3db] shrink-0" />
                            ) : (
                              <Tag className="w-3 h-3 text-[#c8a870] shrink-0" />
                            )}
                            <span className="font-bold text-xs truncate">{m.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#7eb3db] shrink-0" />}
                        </div>
                        <p className="text-[0.65rem] text-[#5a6270] mt-1">
                          Stok saat ini: <strong className="text-[#8ab896] font-mono">{m.currentStock} {m.unit}</strong>
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {activeMat && (
              <div className="space-y-4 pt-2 border-t border-[#1e2330]">
                {isFabric && (
                  <div className="flex items-center justify-between p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs">
                    <span className="text-[#8899aa] font-medium">Satuan Input Pembelian:</span>
                    <div className="flex gap-1 bg-[#12161f] p-0.5 rounded-lg border border-[#2a3040]">
                      <button
                        type="button"
                        onClick={() => setInputUnit('meter')}
                        className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                          inputUnit === 'meter'
                            ? 'bg-[#3d5a80] text-white'
                            : 'text-[#5a6270] hover:text-[#8899aa]'
                        }`}
                      >
                        Meter
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputUnit('yard')}
                        className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                          inputUnit === 'yard'
                            ? 'bg-[#3d5a80] text-white'
                            : 'text-[#5a6270] hover:text-[#8899aa]'
                        }`}
                      >
                        Yard (Konversi Auto)
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                        Jumlah Dibeli ({isFabric ? inputUnit : activeMat.unit}) <span className="text-[#c87070]">*</span>
                      </label>
                      <span className="text-[0.65rem] text-[#5a6270]">Preset kuantiti</span>
                    </div>

                    {/* Quick Qty Chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(isFabric ? [20, 50, 100, 200, 500] : [50, 100, 500, 1000, 5000]).map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQty(n)}
                          className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-semibold transition-all border font-mono ${
                            qty === n
                              ? 'bg-[#121822] text-[#7eb3db] border-[#233548] ring-1 ring-[#7eb3db]'
                              : 'bg-[#0c0f17] text-[#8899aa] border-[#1e2330] hover:bg-[#1a2030]'
                          }`}
                        >
                          {n >= 1000 ? `${n/1000}rb` : n}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      inputMode="decimal"
                      required
                      min={0.1}
                      step={0.1}
                      value={qty || ''}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full p-2.5 text-lg font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#7eb3db] outline-none font-mono"
                      placeholder="0"
                    />
                    {isFabric && inputUnit === 'yard' && qty > 0 && (
                      <div className="p-2 bg-[#121822] border border-[#233548] rounded-lg text-[0.7rem] text-[#7eb3db] mt-1.5 flex items-center justify-between font-mono">
                        <span>Konversi ke Meter:</span>
                        <strong className="text-[#8ab896]">+{effectiveQty} Meter</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                        Harga Beli per {isFabric ? inputUnit : activeMat.unit} (Rp) <span className="text-[#c87070]">*</span>
                      </label>
                      <span className="text-[0.65rem] text-[#5a6270]">Preset harga</span>
                    </div>

                    {/* Quick Price Chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(isFabric ? [28000, 32000, 35000, 40000, 45000] : [200, 500, 1000, 2500, 5000]).map(pr => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setUnitPrice(pr)}
                          className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-semibold transition-all border font-mono ${
                            unitPrice === pr
                              ? 'bg-[#121822] text-[#8ab896] border-[#233548] ring-1 ring-[#8ab896]'
                              : 'bg-[#0c0f17] text-[#8899aa] border-[#1e2330] hover:bg-[#1a2030]'
                          }`}
                        >
                          {pr >= 1000 ? `${(pr / 1000).toFixed(0)}k` : `${pr}`}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      min={1}
                      value={unitPrice || ''}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full p-2.5 text-lg font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#7eb3db] outline-none font-mono"
                      placeholder="0"
                    />
                    {unitPrice > 0 && (
                      <p className="text-[0.7rem] text-[#8ab896] mt-1 font-mono font-semibold">
                        Rp {unitPrice.toLocaleString('id-ID')} / {isFabric ? inputUnit : activeMat.unit}
                      </p>
                    )}
                  </div>
                </div>

                {totalPrice > 0 && (
                  <div className="p-3 bg-[#121822] border border-[#233548] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">Total Pengeluaran Restock:</span>
                    <span className="text-base font-black text-[#8ab896] font-mono">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSavePurchase(true)}
                    className="py-3 bg-[#1a2838] hover:bg-[#233548] text-[#7eb3db] border border-[#2a3c50] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Tambah Lagi</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Riwayat Pembelian */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7eb3db]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pengadaan</h2>
              </div>
              <span className="text-[0.7rem] text-[#8899aa] font-medium">{filteredPurchases.length} Faktur</span>
            </div>

            <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Belanja Terfilter:</span>
              <span className="font-extrabold text-[#7eb3db] font-mono">Rp {totalFilteredSpending.toLocaleString('id-ID')}</span>
            </div>

            {/* History Search with Instant Clear */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bahan atau supplier..."
                value={historySearchQuery}
                onChange={e => setHistorySearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
              {historySearchQuery && (
                <button
                  type="button"
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

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

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredPurchases.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada transaksi pembelian bahan sesuai filter.
              </div>
            ) : (
              filteredPurchases
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map(p => {
                  const matName = p.item_type === 'fabric' ? p.fabric_stock?.name : p.raw_materials?.name;
                  const matUnit = p.item_type === 'fabric' ? (p.fabric_stock?.unit || 'meter') : (p.raw_materials?.unit || 'pcs');
                  const totalItemCost = p.qty * p.unit_price;

                  return (
                    <div key={p.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#e2e6ed]">{matName || 'Bahan'}</span>
                        <span className="font-mono text-[#5a6270] text-[0.7rem]">{p.purchase_date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[0.7rem]">
                        <span className="text-[#8ab896] font-semibold">+{p.qty} {matUnit} @ Rp {p.unit_price.toLocaleString('id-ID')}</span>
                        <span className="font-bold text-[#e2e6ed] font-mono">Rp {totalItemCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270] pt-1">
                        {p.supplier ? (
                          <span className="px-1.5 py-0.5 bg-[#15202b] text-[#7eb3db] border border-[#233548] rounded font-medium">
                            🏪 {p.supplier}
                          </span>
                        ) : (
                          <span className="text-[#5a6270] italic">Tanpa Supplier</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingPurchase(p)}
                          className="text-[#c87070] hover:text-[#e07070] font-semibold px-2 py-0.5 rounded hover:bg-[#241a1a] transition-all"
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
            totalItems={filteredPurchases.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Mobile Sticky Floating Summary & Submit Bar */}
      {activeMat && (effectiveQty > 0 || unitPrice > 0) && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-[#121824]/95 backdrop-blur-md border-t border-[#2a3848] p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="min-w-0">
            <span className="text-[0.65rem] text-[#8899aa] block truncate font-medium">
              {activeMat.name} (+{effectiveQty} {effectiveUnit})
            </span>
            <span className="text-sm font-black text-[#8ab896] font-mono">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            type="button"
            disabled={isSubmitting || effectiveQty <= 0 || unitPrice <= 0}
            onClick={() => handleSavePurchase(false)}
            className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs rounded-xl shadow-sm shrink-0 disabled:opacity-50"
          >
            {isSubmitting ? '...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingPurchase)}
        title="Hapus Catatan Pembelian"
        message={`Apakah Anda yakin ingin menghapus data pembelian bahan ini?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPurchase(null)}
      />

      {/* Success Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Pembelian Berhasil Dicatat!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
