'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  PackagePlus, 
  Scissors, 
  Tag, 
  Clock, 
  Pencil, 
  Trash2, 
  CalendarDays, 
  Calendar, 
  X 
} from 'lucide-react';

interface MaterialItem {
  id: number;
  type: 'fabric' | 'raw';
  name: string;
  unit: string;
  currentStock: number;
  avgPrice: number;
}

interface PurchaseRecord {
  id: number;
  date: string;
  material: string;
  qty: number;
  unit: string;
  price: number;
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

const dummyMaterials: MaterialItem[] = [
  { id: 1, type: 'fabric', name: 'Kain Denim Biru', unit: 'meter', currentStock: 50, avgPrice: 120000 },
  { id: 2, type: 'fabric', name: 'Kain Katun Putih', unit: 'meter', currentStock: 80, avgPrice: 90000 },
  { id: 3, type: 'fabric', name: 'Kain Katun Hitam', unit: 'meter', currentStock: 65, avgPrice: 90000 },
  { id: 4, type: 'fabric', name: 'Kain Katun Navy', unit: 'meter', currentStock: 40, avgPrice: 95000 },
  { id: 5, type: 'fabric', name: 'Kain Chino Khaki', unit: 'meter', currentStock: 30, avgPrice: 110000 },
  { id: 6, type: 'raw', name: 'Kancing Kemeja Putih', unit: 'pcs', currentStock: 500, avgPrice: 350 },
  { id: 7, type: 'raw', name: 'Kancing Kemeja Hitam', unit: 'pcs', currentStock: 350, avgPrice: 350 },
  { id: 8, type: 'raw', name: 'Label Woven Brand', unit: 'pcs', currentStock: 800, avgPrice: 500 },
  { id: 9, type: 'raw', name: 'Resleting YKK 20cm', unit: 'pcs', currentStock: 200, avgPrice: 4500 },
  { id: 10, type: 'raw', name: 'Karet Pinggang 3cm', unit: 'meter', currentStock: 100, avgPrice: 3000 },
];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const initialPurchases: PurchaseRecord[] = [
  { id: 305, date: getTodayDateString(), material: 'Kain Katun Putih', qty: 50, unit: 'meter', price: 4500000 },
  { id: 304, date: '2026-08-24', material: 'Kancing Kemeja Putih', qty: 1000, unit: 'pcs', price: 350000 },
  { id: 303, date: '2026-08-20', material: 'Kain Denim Biru', qty: 40, unit: 'meter', price: 4800000 },
  { id: 302, date: '2026-08-15', material: 'Label Woven Brand', qty: 500, unit: 'pcs', price: 250000 },
  { id: 301, date: '2026-08-05', material: 'Resleting YKK 20cm', qty: 150, unit: 'pcs', price: 675000 },
];

export default function PembelianPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [inputUnit, setInputUnit] = useState<'meter' | 'yard'>('meter');
  const [qty, setQty] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(initialPurchases);

  // Filters (Default: TODAY)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & CRUD State
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseRecord | null>(null);

  const activeMat = dummyMaterials.find(m => m.id === selectedMaterial);

  // 1 yard = 0.9144 meter
  const isFabric = activeMat?.type === 'fabric';
  const effectiveQty = isFabric && inputUnit === 'yard' ? Number((qty * 0.9144).toFixed(2)) : qty;
  const effectiveUnit = isFabric ? 'meter' : (activeMat?.unit || 'pcs');

  const handleSelectMaterial = (id: number) => {
    setSelectedMaterial(id);
    setInputUnit('meter');
    const mat = dummyMaterials.find(m => m.id === id);
    if (mat && qty > 0) {
      setPrice(mat.avgPrice * qty);
    }
  };

  const handleQtyChange = (newQty: number) => {
    setQty(newQty);
    if (activeMat && newQty > 0) {
      setPrice(activeMat.avgPrice * newQty);
    }
  };

  // Create Purchase
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMat || qty <= 0 || price <= 0) return;

    const newPurchase: PurchaseRecord = {
      id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 300,
      date: getTodayDateString(),
      material: activeMat.name,
      qty: effectiveQty,
      unit: effectiveUnit,
      price,
    };

    setPurchases([newPurchase, ...purchases]);

    const lines = [
      `Bahan: ${activeMat.name}`,
      isFabric && inputUnit === 'yard'
        ? `Input: ${qty} yard \u2192 Dikonversi: +${effectiveQty} meter`
        : `Jumlah dibeli: +${effectiveQty} ${effectiveUnit}`,
      `Total Pembelian: Rp ${price.toLocaleString('id-ID')}`,
      `Stok baru di gudang: ${(activeMat.currentStock + effectiveQty).toFixed(2)} ${effectiveUnit}`,
      `Harga rata-rata tertimbang: Rp ${Math.round(price / effectiveQty).toLocaleString('id-ID')} / ${effectiveUnit}`,
    ];

    setModalLines(lines);
    setShowModal(true);

    setSelectedMaterial(null);
    setQty(0);
    setPrice(0);
    setInputUnit('meter');
  };

  // Update Purchase
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;

    setPurchases(prev => prev.map(p => p.id === editingPurchase.id ? editingPurchase : p));
    setEditingPurchase(null);
  };

  // Delete Purchase
  const handleConfirmDelete = () => {
    if (!deletingPurchase) return;
    setPurchases(prev => prev.filter(p => p.id !== deletingPurchase.id));
    setDeletingPurchase(null);
  };

  // Date Filtering Logic
  const matchesDateFilter = (dateStr: string) => {
    const todayStr = getTodayDateString();
    
    if (dateFilter === 'TODAY') return dateStr === todayStr;
    
    if (dateFilter === '7_DAYS') {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      return dateStr >= sevenDaysAgoStr && dateStr <= todayStr;
    }
    
    if (dateFilter === '30_DAYS') {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      return dateStr >= thirtyDaysAgoStr && dateStr <= todayStr;
    }
    
    if (dateFilter === 'CUSTOM') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }
    
    return true;
  };

  const filteredPurchases = purchases.filter(p => matchesDateFilter(p.date));
  const totalFilteredNominal = filteredPurchases.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div>
      <PageHeader 
        title="Catat Pembelian Bahan" 
        description="Input belanja kain per roll/warna atau bahan baku rasio-tetap (mendukung edit & hapus)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Step 1: Pilih Bahan */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#8899aa] font-bold text-xs flex items-center justify-center">1</span>
                <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Bahan yang Dibeli</label>
              </div>
              <select
                className="w-full p-3.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm sm:text-base focus:border-[#4a6d8c] outline-none font-medium appearance-none cursor-pointer"
                value={selectedMaterial || ''}
                onChange={(e) => handleSelectMaterial(Number(e.target.value))}
                required
              >
                <option value="" disabled>-- Pilih Kain atau Bahan Baku --</option>
                <optgroup label="🧵 Kain (Per Roll/Warna)">
                  {dummyMaterials.filter(m => m.type === 'fabric').map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Stok: {m.currentStock} {m.unit})</option>
                  ))}
                </optgroup>
                <optgroup label="🏷️ Bahan Rasio-Tetap (Kancing, Label, Resleting)">
                  {dummyMaterials.filter(m => m.type === 'raw').map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Stok: {m.currentStock} {m.unit})</option>
                  ))}
                </optgroup>
              </select>

              {activeMat && (
                <div className="mt-3 p-3.5 bg-[#151a24] border border-[#2a3040] rounded-xl flex items-center justify-between text-xs text-[#b0b8c4]">
                  <span className="flex items-center gap-1.5">
                    {activeMat.type === 'fabric' ? <Scissors className="w-3.5 h-3.5 text-[#7a8a9a]" /> : <Tag className="w-3.5 h-3.5 text-[#7a8a9a]" />}
                    <span>Stok Saat Ini: <strong className="text-[#e2e6ed]">{activeMat.currentStock} {activeMat.unit}</strong></span>
                  </span>
                  <span>Est. Harga: <strong className="text-[#e2e6ed]">Rp {activeMat.avgPrice.toLocaleString('id-ID')} / {activeMat.unit}</strong></span>
                </div>
              )}
            </div>

            {/* Step 2: Input Qty & Price */}
            {activeMat && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {isFabric && (
                  <div className="flex items-center justify-between p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs">
                    <span className="text-[#8899aa] font-semibold">Satuan Pembelian:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInputUnit('meter')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          inputUnit === 'meter'
                            ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                            : 'bg-[#12161f] text-[#5a6270] hover:text-[#8899aa]'
                        }`}
                      >
                        Meter (Standar)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputUnit('yard')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          inputUnit === 'yard'
                            ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
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
                    <label className="block text-xs font-semibold text-[#8899aa] mb-1.5 text-center">
                      Jumlah Dibeli ({isFabric ? inputUnit : activeMat.unit}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step={0.1}
                      placeholder="0"
                      className="w-full p-3.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                      value={qty || ''}
                      onChange={(e) => handleQtyChange(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8899aa] mb-1.5 text-center">
                      Total Biaya Pembelian (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      placeholder="0"
                      className="w-full p-3.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                {isFabric && inputUnit === 'yard' && qty > 0 && (
                  <div className="p-3 bg-[#151a24] border border-[#2a3848] rounded-xl text-xs text-[#aab8c8] flex items-center justify-between animate-in fade-in duration-150">
                    <span className="flex items-center gap-1.5 text-[#8899aa]">
                      <Scissors className="w-3.5 h-3.5 text-[#7a8a9a]" />
                      <span>Konversi Otomatis ke Stok Gudang:</span>
                    </span>
                    <span className="font-bold text-[#6ea87a]">
                      {qty} yard &rarr; {effectiveQty} meter
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 text-sm sm:text-base font-bold bg-[#3d5a80] hover:bg-[#4a6d8c] text-white rounded-xl transition-all shadow-sm active:scale-[0.99]"
                >
                  Simpan Pembelian {isFabric ? `(+${effectiveQty} meter)` : ''}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Riwayat Pembelian Terakhir with Filter, Edit & Delete */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
          {/* Header Panel */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7a8a9a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pembelian</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">
                {filteredPurchases.length} dari {purchases.length} Transaksi
              </span>
            </div>

            {/* Total Widget */}
            <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Pengeluaran Beli:</span>
              <span className="font-extrabold text-[#e2e6ed] font-mono text-xs sm:text-sm">
                Rp {totalFilteredNominal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Date Filters (Default: Hari Ini) */}
            <div className="space-y-2 pt-1 border-t border-[#1e2330]">
              <div className="flex items-center justify-between text-[0.65rem] font-bold text-[#5a6270] uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#8899aa]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#7a8a9a]" />
                  <span>Filter Tanggal</span>
                </span>
                {dateFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('ALL');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-[#6b8aaf] hover:text-[#8899aa] flex items-center gap-0.5 normal-case font-medium"
                  >
                    <X className="w-3 h-3" /> Reset (Semua)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setDateFilter('TODAY')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === 'TODAY'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('7_DAYS')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === '7_DAYS'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('30_DAYS')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === '30_DAYS'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                  }`}
                >
                  1 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('ALL')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === 'ALL'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Custom Date Range Toggle */}
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'CUSTOM' ? 'TODAY' : 'CUSTOM')}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[0.65rem] font-bold flex items-center justify-between transition-all border ${
                  dateFilter === 'CUSTOM'
                    ? 'bg-[#1a2838] text-[#aab8c8] border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#7a8a9a]" />
                  <span>Pilih Rentang Waktu Kustom</span>
                </span>
                <span className="text-[0.6rem] opacity-70">
                  {dateFilter === 'CUSTOM' ? 'Aktif' : 'Atur Tanggal \u2192'}
                </span>
              </button>

              {dateFilter === 'CUSTOM' && (
                <div className="p-2.5 bg-[#0c0f17] border border-[#2a3848] rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[0.6rem] font-semibold text-[#5a6270] mb-0.5">Dari Tanggal</label>
                      <input 
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full p-1.5 bg-[#12161f] border border-[#2a3040] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.6rem] font-semibold text-[#5a6270] mb-0.5">Sampai Tanggal</label>
                      <input 
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full p-1.5 bg-[#12161f] border border-[#2a3040] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List of Purchases */}
          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[480px]">
            {filteredPurchases.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270] space-y-1">
                <p className="font-semibold text-[#8899aa]">Tidak ada data pembelian untuk filter ini.</p>
                <p className="text-[0.7rem] text-[#5a6270]">
                  {dateFilter === 'TODAY' ? 'Belum ada pembelian hari ini. Coba pilih filter "7 Hari" atau "Semua".' : 'Coba ubah filter tanggal di atas.'}
                </p>
              </div>
            ) : (
              filteredPurchases.map(p => (
                <div key={p.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#e2e6ed] text-xs">{p.material}</span>
                    <span className="font-mono text-[#5a6270] text-[0.7rem]">#{p.id} • {p.date}</span>
                  </div>

                  <div className="flex items-center justify-between text-[0.7rem] pt-0.5 text-[#8899aa]">
                    <span className="text-[#6b8aaf] font-semibold">+{p.qty} {p.unit}</span>
                    <span className="font-bold text-[#e2e6ed] font-mono text-xs">
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="pt-2 border-t border-[#1e2330] flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingPurchase(p)}
                      className="p-1.5 px-2 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] text-[0.65rem] font-semibold flex items-center gap-1 transition-colors"
                      title="Edit Pembelian"
                    >
                      <Pencil className="w-3 h-3 text-[#7a8a9a]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingPurchase(p)}
                      className="p-1.5 px-2 rounded-lg bg-[#2a1a1a] hover:bg-[#3a2222] text-[#b85c5c] border border-[#3a2828] text-[0.65rem] font-semibold flex items-center gap-1 transition-colors"
                      title="Hapus Pembelian"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Pembelian #{editingPurchase.id}</h3>
              </div>
              <button 
                onClick={() => setEditingPurchase(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Bahan</label>
                <input
                  type="text"
                  disabled
                  value={editingPurchase.material}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[#5a6270] text-xs font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Tanggal Pembelian</label>
                <input
                  type="date"
                  required
                  value={editingPurchase.date}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, date: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Jumlah ({editingPurchase.unit})</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPurchase.qty}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, qty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Total Biaya (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={editingPurchase.price}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#3d5a80] hover:bg-[#4a6d8c] text-white transition-all shadow-sm active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPurchase && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Data Pembelian"
          itemName={`#${deletingPurchase.id} • ${deletingPurchase.material}`}
          details={[
            `Jumlah: +${deletingPurchase.qty} ${deletingPurchase.unit}`,
            `Total Biaya: Rp ${deletingPurchase.price.toLocaleString('id-ID')}`,
            `Tanggal: ${deletingPurchase.date}`,
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingPurchase(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Pembelian Berhasil Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
