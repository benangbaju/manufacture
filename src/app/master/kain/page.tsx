'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDbFabricStock, createDbFabric, updateDbFabric, deleteDbFabric } from "@/lib/services/db";
import { Scissors, Plus, Pencil, Trash2, X, Search, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface KainItem {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
}

const FABRIC_SUGGESTIONS = [
  'Katun Toyobo Hitam', 'Katun Toyobo Putih', 'Katun Poplin Navy', 'Linen Rami Sage', 'Rayon Twill Mocca', 'Flanel Maroon'
];

export default function KainPage() {
  const [data, setData] = useState<KainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [inputUnit, setInputUnit] = useState<'meter' | 'yard'>('meter');
  const [stockInput, setStockInput] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<KainItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<KainItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDbFabricStock();
      setData(res || []);
    } catch (err) {
      console.error('Failed to load fabric stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Conversion logic: 1 yard = 0.9144 meter
  const stockInMeters = inputUnit === 'yard' ? Number((stockInput * 0.9144).toFixed(2)) : stockInput;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createDbFabric(name.trim(), 'meter', stockInMeters);
      const lines = [
        `Kain: ${name}`,
        inputUnit === 'yard' 
          ? `Input: ${stockInput} yard → Dikonversi: ${stockInMeters} meter`
          : `Stok awal: ${stockInMeters} meter`,
        `Satuan tersimpan di database: meter`,
      ];
      setModalLines(lines);
      setShowModal(true);
      setName('');
      setStockInput(0);
      setInputUnit('meter');
      await loadData();
    } catch (err: any) {
      alert('Gagal menambah stok kain: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      await updateDbFabric(editingItem.id, editingItem.name, editingItem.unit || 'meter', Number(editingItem.stock_qty || 0));
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteDbFabric(deletingItem.id);
      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus kain: ' + err.message);
    }
  };

  // Filtered fabric data
  const filteredData = data.filter(k => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return k.name.toLowerCase().includes(q);
  });

  const totalVolume = data.reduce((a, b) => a + Number(b.stock_qty || 0), 0);
  const totalYards = (totalVolume / 0.9144).toFixed(1);
  const lowStockCount = data.filter(k => Number(k.stock_qty || 0) < 30).length;

  return (
    <div>
      <PageHeader 
        title="Stok Kain Roll per Warna" 
        description="Master roll kain per varian warna (kain dikelola terpisah karena yield potongnya variatif)" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Jenis Kain</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">{data.length} <span className="text-xs font-normal text-[#5a6270]">Roll / Warna</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Stok (Meter)</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">{totalVolume.toFixed(1)} <span className="text-xs font-normal text-[#5a6270]">meter</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Setara Yard</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">{totalYards} <span className="text-xs font-normal text-[#5a6270]">yard</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Kain Menipis (&lt;30m)</span>
          <p className={`text-xl sm:text-2xl font-black font-mono ${lowStockCount > 0 ? 'text-[#c8a870]' : 'text-[#8899aa]'}`}>
            {lowStockCount} <span className="text-xs font-normal text-[#5a6270]">Jenis</span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col">
          {/* Table Header with Search */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari jenis kain atau warna..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
            </div>
            <span className="text-xs text-[#8899aa] font-semibold shrink-0">
              {filteredData.length} dari {data.length} Kain
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#5a6270]">Memuat data stok kain dari database...</div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">
                {searchQuery ? 'Tidak ada jenis kain yang cocok' : 'Belum ada data stok kain'}
              </p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Silakan daftarkan kain roll pertama Anda melalui formulir di sebelah kanan.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">Nama Kain / Warna</th>
                    <th className="p-3.5 text-center">Stok Meter</th>
                    <th className="p-3.5 text-center hidden sm:table-cell">Setara Yard</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {filteredData.map(k => {
                    const isLow = Number(k.stock_qty || 0) < 30;
                    const yards = (Number(k.stock_qty || 0) / 0.9144).toFixed(1);
                    return (
                      <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-bold text-[#e2e6ed]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#7eb3db]"></span>
                            <span>{k.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold font-mono px-2.5 py-1 rounded-lg border text-xs ${
                            isLow 
                              ? 'bg-[#201e1a] text-[#c8a870] border-[#3a3020]' 
                              : 'bg-[#1a2a20] text-[#8ab896] border-[#2a3828]'
                          }`}>
                            {Number(k.stock_qty || 0).toFixed(1)} m
                          </span>
                        </td>
                        <td className="p-3.5 text-center hidden sm:table-cell text-[#8899aa] font-mono text-xs">
                          {yards} yd
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingItem(k)}
                              className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] transition-colors"
                              title="Edit Kain"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(k)}
                              className="p-1.5 rounded-lg bg-[#241a1a] hover:bg-[#341e1e] text-[#c87070] border border-[#3a2020] transition-colors"
                              title="Hapus Kain"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Fabric Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7eb3db] flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Kain Roll</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Daftarkan stok kain per warna</p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nama Kain & Warna <span className="text-[#c87070]">*</span>
              </label>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1 mb-2">
                {FABRIC_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setName(s)}
                    className="px-2 py-0.5 rounded-lg text-[0.65rem] font-medium bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa] transition-all"
                  >
                    + {s}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                required
                placeholder="Contoh: Katun Poplin Hitam"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                  Satuan Input
                </label>
                <div className="flex bg-[#0c0f17] border border-[#2a3040] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setInputUnit('meter')}
                    className={`px-2.5 py-0.5 rounded text-[0.65rem] font-bold transition-all ${
                      inputUnit === 'meter' ? 'bg-[#3d5a80] text-white' : 'text-[#5a6270]'
                    }`}
                  >
                    Meter
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputUnit('yard')}
                    className={`px-2.5 py-0.5 rounded text-[0.65rem] font-bold transition-all ${
                      inputUnit === 'yard' ? 'bg-[#3d5a80] text-white' : 'text-[#5a6270]'
                    }`}
                  >
                    Yard
                  </button>
                </div>
              </div>

              <input 
                type="number" 
                step="0.1"
                min="0"
                placeholder="0"
                value={stockInput || ''}
                onChange={e => setStockInput(Number(e.target.value))}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-mono font-bold"
              />

              {/* Conversion Preview Box */}
              {inputUnit === 'yard' && stockInput > 0 && (
                <div className="mt-2 p-2 bg-[#121822] border border-[#233548] rounded-xl text-[0.7rem] text-[#7eb3db] flex items-center justify-between">
                  <span>Konversi otomatis:</span>
                  <span className="font-bold font-mono">{stockInput} yard = {stockInMeters} meter</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kain Roll'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2330]">
              <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Kain Roll #{editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Nama Kain</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Stok (Meter)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editingItem.stock_qty}
                  onChange={e => setEditingItem({ ...editingItem, stock_qty: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#7eb3db] text-xs sm:text-sm font-mono font-bold focus:border-[#7eb3db] outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-[#1a2030] text-[#b0b8c4] rounded-xl text-xs font-semibold hover:bg-[#222a3a]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white rounded-xl text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Hapus Kain Roll"
        message={`Apakah Anda yakin ingin menghapus "${deletingItem?.name}"? Data pemetaan kain dan histori produksi terkait mungkin terpengaruh.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal}
        title="Kain Berhasil Didaftarkan"
        lines={modalLines}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
