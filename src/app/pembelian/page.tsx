'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
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
  Plus
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

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function PembelianPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>(''); // e.g. "fabric-1" or "raw-2"
  const [inputUnit, setInputUnit] = useState<'meter' | 'yard'>('meter');
  const [qty, setQty] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDateString());

  // Filters (Default: ALL)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & State
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setModalLines(lines);
      setShowModal(true);

      setQty(0);
      setUnitPrice(0);
      setSupplier('');
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

  // Date & Supplier Filtering Logic
  const today = getTodayDateString();
  const filteredPurchases = purchases.filter(p => {
    if (supplierFilter !== 'ALL' && p.supplier !== supplierFilter) return false;

    if (dateFilter === 'ALL') return true;
    if (dateFilter === 'TODAY') return p.purchase_date === today;
    if (dateFilter === '7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(p.purchase_date) >= sevenDaysAgo;
    }
    if (dateFilter === '30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(p.purchase_date) >= thirtyDaysAgo;
    }
    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const pDate = new Date(p.purchase_date);
      if (customStartDate && pDate < new Date(customStartDate)) return false;
      if (customEndDate && pDate > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  });

  const totalFilteredSpending = filteredPurchases.reduce((a, b) => a + (b.qty * b.unit_price), 0);

  return (
    <div>
      <PageHeader 
        title="Pembelian & Restock Bahan" 
        description="Catat pembelian kain roll atau bahan baku rasio-tetap untuk menambah stok gudang secara otomatis"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Form Pembelian */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border-[#1e2330]">
          <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider mb-4 flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-[#8ab896]" />
            <span>Form Restock Bahan Masuk</span>
          </h2>

          <form onSubmit={handleSavePurchase} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Tanggal Pembelian
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none font-medium"
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
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none font-medium"
                />
                <datalist id="supplier-options">
                  {existingSuppliers.map((s, idx) => (
                    <option key={idx} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Pilih Bahan Baku / Kain yang Dibeli <span className="text-[#c87070]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[160px] overflow-y-auto p-1 bg-[#0c0f17] rounded-xl border border-[#1e2330]">
                {materials.map(m => {
                  const key = `${m.type}-${m.id}`;
                  const isSelected = selectedMaterialKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMaterialKey(key)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        isSelected 
                          ? 'bg-[#1a2838] text-[#aab8c8] border-[#2a3848]' 
                          : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">{m.name}</span>
                        {isSelected && <Tag className="w-3 h-3 text-[#8ab896] shrink-0" />}
                      </div>
                      <p className="text-[0.65rem] text-[#5a6270] mt-0.5">
                        Stok: <strong className="text-[#8ab896]">{m.currentStock} {m.unit}</strong>
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeMat && (
              <div className="space-y-4 pt-2 border-t border-[#1e2330]">
                {isFabric && (
                  <div className="flex items-center justify-between p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs">
                    <span className="text-[#8899aa]">Satuan Beli Kain:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInputUnit('meter')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          inputUnit === 'meter'
                            ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                            : 'bg-[#12161f] text-[#5a6270] hover:text-[#8899aa]'
                        }`}
                      >
                        Meter
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputUnit('yard')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          inputUnit === 'yard'
                            ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                            : 'bg-[#12161f] text-[#5a6270] hover:text-[#8899aa]'
                        }`}
                      >
                        Yard (Konversi)
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                      Jumlah Dibeli ({isFabric ? inputUnit : activeMat.unit}) <span className="text-[#c87070]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step={0.1}
                      value={qty || ''}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full p-3 text-xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                      Harga Satuan / Per {isFabric ? inputUnit : activeMat.unit} (Rp) <span className="text-[#c87070]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={unitPrice || ''}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full p-3 text-xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>

                {totalPrice > 0 && (
                  <div className="p-3 bg-[#151a24] border border-[#2a3040] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">Total Pembayaran:</span>
                    <span className="text-base font-black text-[#6ea87a] font-mono">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian Bahan'}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Riwayat Pembelian */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7a8a9a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pembelian</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">{filteredPurchases.length} Transaksi</span>
            </div>

            <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Belanja:</span>
              <span className="font-extrabold text-[#e2e6ed] font-mono">Rp {totalFilteredSpending.toLocaleString('id-ID')}</span>
            </div>

            {/* Supplier Filter */}
            {existingSuppliers.length > 0 && (
              <div>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-[0.7rem] text-[#e2e6ed] outline-none font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Supplier ({existingSuppliers.length})</option>
                  {existingSuppliers.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => setDateFilter('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  dateFilter === 'ALL'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('TODAY')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  dateFilter === 'TODAY'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('30_DAYS')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  dateFilter === '30_DAYS'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredPurchases.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada transaksi pembelian bahan.
              </div>
            ) : (
              filteredPurchases.map(p => {
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
                        <span>-</span>
                      )}
                      <button
                        onClick={() => setDeletingPurchase(p)}
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
