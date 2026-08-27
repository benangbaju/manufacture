'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDbRawMaterials, createDbRawMaterial, updateDbRawMaterial, deleteDbRawMaterial } from "@/lib/services/db";
import { Tag, Plus, Pencil, Trash2, X, Search, CheckCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';

interface BahanItem {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
}

const ACCESSORY_SUGGESTIONS = [
  { name: 'Kancing Kemeja 4 Lubang', unit: 'pcs' },
  { name: 'Label Brand Woven', unit: 'pcs' },
  { name: 'Label Care & Washing', unit: 'pcs' },
  { name: 'Resleting YKK 15cm', unit: 'pcs' },
  { name: 'Benang Jahit No.40', unit: 'cone' },
  { name: 'Polybag Plastik Sablon', unit: 'pcs' },
  { name: 'Hangtag Baju + Tali', unit: 'pcs' },
];

export default function BahanBakuPage() {
  const [data, setData] = useState<BahanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'stock-desc' | 'stock-asc' | 'newest' | 'oldest'>('name-asc');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [stock, setStock] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<BahanItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BahanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDbRawMaterials();
      setData(res || []);
    } catch (err) {
      console.error('Failed to load raw materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createDbRawMaterial(name.trim(), unit, stock);
      setModalLines([
        `Bahan Baku: ${name}`,
        `Satuan: ${unit}`,
        `Stok awal: ${stock} ${unit}`,
      ]);
      setShowModal(true);
      setName('');
      setStock(0);
      await loadData();
    } catch (err: any) {
      alert('Gagal menambah bahan baku: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      await updateDbRawMaterial(editingItem.id, editingItem.name, editingItem.unit || 'pcs', Number(editingItem.stock_qty || 0));
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteDbRawMaterial(deletingItem.id);
      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus bahan baku: ' + err.message);
    }
  };

  // Filtered & Sorted raw materials
  const filteredData = data
    .filter(r => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'id');
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'id');
      if (sortBy === 'stock-desc') return Number(b.stock_qty || 0) - Number(a.stock_qty || 0);
      if (sortBy === 'stock-asc') return Number(a.stock_qty || 0) - Number(b.stock_qty || 0);
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      return a.name.localeCompare(b.name, 'id');
    });

  const totalStockCount = data.reduce((a, b) => a + Number(b.stock_qty || 0), 0);
  const lowStockCount = data.filter(r => Number(r.stock_qty || 0) < 100).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl skeleton-shimmer" />
          <div className="h-96 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Bahan Baku Rasio-Tetap (BOM)" 
        description="Master komponen non-kain (kancing, label, resleting, benang) yang dikonsumsi per pcs produk" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Jenis Aksesoris BOM</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">{data.length} <span className="text-xs font-normal text-[#5a6270]">Bahan</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Stok Keseluruhan</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">{totalStockCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-[#5a6270]">unit</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330] col-span-2 sm:col-span-1">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Stok Menipis (&lt;100)</span>
          <p className={`text-xl sm:text-2xl font-black font-mono ${lowStockCount > 0 ? 'text-[#c8a870]' : 'text-[#8ab896]'}`}>
            {lowStockCount} <span className="text-xs font-normal text-[#5a6270]">Bahan</span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col">
          {/* Header with Search & Sort Filter */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bahan baku, kancing, label..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sorting Dropdown & Counter */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl px-2.5 py-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#7eb3db] shrink-0" />
                <span className="text-[0.68rem] text-[#8899aa] font-medium hidden sm:inline">Urutan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-[#e2e6ed] outline-none cursor-pointer pr-1"
                >
                  <option value="name-asc">Nama Bahan (A - Z)</option>
                  <option value="name-desc">Nama Bahan (Z - A)</option>
                  <option value="stock-desc">Stok Terbanyak (Unit ↓)</option>
                  <option value="stock-asc">Stok Kritis / Menipis (↑)</option>
                  <option value="newest">Terbaru Ditambahkan</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>
              <span className="text-xs text-[#8899aa] font-semibold hidden md:inline">
                {filteredData.length} dari {data.length} Bahan
              </span>
            </div>
          </div>

          {filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">
                {searchQuery ? 'Tidak ada bahan yang cocok' : 'Belum ada data bahan baku'}
              </p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Silakan daftarkan bahan aksesoris pertama Anda melalui form di sebelah kanan.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">Nama Bahan</th>
                    <th className="p-3.5 text-center">Satuan</th>
                    <th className="p-3.5 text-center">Stok Fisik Gudang</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {filteredData.map(d => {
                    const isLow = Number(d.stock_qty || 0) < 100;
                    return (
                      <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-bold text-[#e2e6ed]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#7eb3db]"></span>
                            <span>{d.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center text-[#8899aa] font-mono text-xs">{d.unit}</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold font-mono px-2.5 py-1 rounded-lg border text-xs ${
                            isLow 
                              ? 'bg-[#201e1a] text-[#c8a870] border-[#3a3020]' 
                              : 'bg-[#1a2a20] text-[#8ab896] border-[#2a3828]'
                          }`}>
                            {Number(d.stock_qty || 0).toLocaleString('id-ID')} {d.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingItem(d)}
                              className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] transition-colors"
                              title="Edit Bahan"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(d)}
                              className="p-1.5 rounded-lg bg-[#241a1a] hover:bg-[#341e1e] text-[#c87070] border border-[#3a2020] transition-colors"
                              title="Hapus Bahan"
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

        {/* Add Material Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7eb3db] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Bahan Baku</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Kancing, label, resleting, benang, dll.</p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nama Bahan Baku <span className="text-[#c87070]">*</span>
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1 mb-2">
                {ACCESSORY_SUGGESTIONS.map(s => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      setName(s.name);
                      setUnit(s.unit);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[0.65rem] font-medium bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa] transition-all"
                  >
                    + {s.name}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                required
                placeholder="Contoh: Kancing 4 Lubang Hitam"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Satuan
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="pcs / pack / roll"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                    Stok Awal
                  </label>
                </div>
                <div className="flex gap-1 mb-1.5">
                  {[100, 500, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStock(prev => (prev || 0) + val)}
                      className="px-1.5 py-0.5 rounded text-[0.6rem] bg-[#0c0f17] text-[#8899aa] border border-[#1e2330] hover:text-[#e2e6ed]"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  value={stock || ''}
                  onChange={e => setStock(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Bahan Baku'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2330]">
              <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Bahan Baku #{editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Nama Bahan</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Satuan</label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.stock_qty}
                    onChange={e => setEditingItem({ ...editingItem, stock_qty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#7eb3db] text-xs sm:text-sm font-mono font-bold focus:border-[#7eb3db] outline-none"
                  />
                </div>
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
        title="Hapus Bahan Baku"
        message={`Apakah Anda yakin ingin menghapus "${deletingItem?.name}"? Resep produk (BOM) yang menggunakan bahan ini dapat terpengaruh.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal}
        title="Bahan Baku Berhasil Ditambahkan"
        lines={modalLines}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
