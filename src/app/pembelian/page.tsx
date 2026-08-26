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

  // Date Filtering Logic
  const today = getTodayDateString();
  const filteredPurchases = purchases.filter(p => {
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
        title="Catat Pembelian Bahan" 
        description="Input belanja kain roll atau bahan baku aksesoris (otomatis menambah stok fisik di database)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          {materials.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <PackagePlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada data kain atau bahan baku</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan tambahkan data di menu <strong>Master Kain</strong> atau <strong>Master Bahan Baku</strong> terlebih dahulu.
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSavePurchase}>
              {/* Step 1: Pilih Bahan */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#8899aa] font-bold text-xs flex items-center justify-center">1</span>
                  <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Bahan yang Dibeli</label>
                </div>
                <select
                  className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                  value={selectedMaterialKey}
                  onChange={(e) => {
                    setSelectedMaterialKey(e.target.value);
                    setInputUnit('meter');
                  }}
                  required
                >
                  <optgroup label="🧵 Stok Kain (Per Roll / Warna)">
                    {materials.filter(m => m.type === 'fabric').map(m => (
                      <option key={`fabric-${m.id}`} value={`fabric-${m.id}`}>
                        {m.name} (Stok saat ini: {m.currentStock.toFixed(1)} {m.unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🏷️ Bahan Rasio-Tetap (Kancing, Label, Resleting)">
                    {materials.filter(m => m.type === 'raw').map(m => (
                      <option key={`raw-${m.id}`} value={`raw-${m.id}`}>
                        {m.name} (Stok saat ini: {m.currentStock} {m.unit})
                      </option>
                    ))}
                  </optgroup>
                </select>

                {activeMat && (
                  <div className="mt-2.5 p-3 bg-[#151a24] border border-[#2a3040] rounded-xl flex items-center justify-between text-xs text-[#b0b8c4]">
                    <span className="flex items-center gap-1.5">
                      {activeMat.type === 'fabric' ? <Scissors className="w-3.5 h-3.5 text-[#7a8a9a]" /> : <Tag className="w-3.5 h-3.5 text-[#7a8a9a]" />}
                      <span>Stok di Gudang: <strong className="text-[#8ab896]">{activeMat.currentStock} {activeMat.unit}</strong></span>
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Form Detail Pembelian */}
              {activeMat && (
                <div className="space-y-4 pt-2 border-t border-[#1e2330]">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                        Tanggal Pembelian
                      </label>
                      <input 
                        type="date"
                        required
                        value={purchaseDate}
                        onChange={e => setPurchaseDate(e.target.value)}
                        className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                        Nama Supplier / Toko (Opsional)
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Toko Kain Berkah"
                        value={supplier}
                        onChange={e => setSupplier(e.target.value)}
                        className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none placeholder-[#3a4454]"
                      />
                    </div>
                  </div>

                  {isFabric && (
                    <div className="flex items-center justify-between p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs">
                      <span className="text-[#8899aa] font-semibold">Satuan Pembelian:</span>
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
                        className="w-full p-3 text-xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
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
                        className="w-full p-3 text-xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {totalPrice > 0 && (
                    <div className="p-3 bg-[#151a24] border border-[#2a3040] rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[#8899aa]">Total Pembayaran:</span>
                      <span className="text-base font-black text-[#6ea87a]">Rp {totalPrice.toLocaleString('id-ID')}</span>
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
          )}
        </div>

        {/* Right Column: Riwayat Pembelian */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7a8a9a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pembelian</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">{filteredPurchases.length} Transaksi</span>
            </div>

            <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Belanja:</span>
              <span className="font-extrabold text-[#e2e6ed]">Rp {totalFilteredSpending.toLocaleString('id-ID')}</span>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-1">
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
                  <div key={p.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#e2e6ed]">{matName || 'Bahan'}</span>
                      <span className="font-mono text-[#5a6270] text-[0.7rem]">{p.purchase_date}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.7rem]">
                      <span className="text-[#8ab896] font-semibold">+{p.qty} {matUnit}</span>
                      <span className="font-bold text-[#e2e6ed]">Rp {totalItemCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.65rem] text-[#5a6270] pt-1">
                      <span>{p.supplier ? `Supplier: ${p.supplier}` : 'Tanpa supplier'}</span>
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
        message={`Apakah Anda yakin ingin menghapus catatan pembelian ini?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPurchase(null)}
      />

      {/* Success Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Pembelian Berhasil Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}

