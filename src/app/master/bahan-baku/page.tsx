'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDbRawMaterials, createDbRawMaterial, updateDbRawMaterial, deleteDbRawMaterial } from "@/lib/services/db";
import { Tag, Plus, Pencil, Trash2, X } from 'lucide-react';

interface BahanItem {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
}

export default function BahanBakuPage() {
  const [data, setData] = useState<BahanItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div>
      <PageHeader 
        title="Bahan Baku Rasio-Tetap" 
        description="Master komponen non-kain (kancing, label, resleting, benang) yang dikonsumsi per pcs produk" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330]">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between text-xs text-[#5a6270]">
            <span className="font-semibold text-[#8899aa]">Total: {data.length} Jenis Bahan</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#5a6270]">Memuat data bahan baku dari database...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada data bahan baku</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan daftarkan bahan aksesoris pertama Anda melalui form di sebelah kanan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">Nama Bahan</th>
                    <th className="p-3.5">Satuan</th>
                    <th className="p-3.5">Stok Saat Ini</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {data.map(d => (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-bold text-[#e2e6ed] flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#7a8a9a] opacity-80" />
                        <span>{d.name}</span>
                      </td>
                      <td className="p-3.5 text-[#5a6270] text-xs">{d.unit}</td>
                      <td className="p-3.5">
                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${d.stock_qty < 100 ? 'bg-[#201e1a] text-[#b89860] border border-[#3a3020]' : 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]'}`}>
                          {d.stock_qty} {d.unit}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Tambah Bahan Baku */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Bahan Baku Baru</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Kancing, label woven, resleting, dsb</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nama Bahan Baku <span className="text-[#c87070]">*</span>
              </label>
              <input 
                type="text" 
                required 
                placeholder="Contoh: Kancing Kemeja Putih"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454]"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Satuan Ukuran
              </label>
              <select 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none cursor-pointer"
              >
                <option value="pcs">pcs (Kancing, Label, Resleting)</option>
                <option value="meter">meter (Karet Pinggang, Tali)</option>
                <option value="roll">roll (Benang Jahit)</option>
                <option value="pack">pack</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Stok Awal
              </label>
              <input 
                type="number" 
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-bold"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Bahan Baku'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Bahan Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2330]">
              <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Bahan Baku #{editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Satuan</label>
                <input
                  type="text"
                  required
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Stok</label>
                <input
                  type="number"
                  min={0}
                  value={editingItem.stock_qty || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, stock_qty: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm font-bold focus:border-[#4a6d8c] outline-none"
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
        title="Hapus Bahan Baku"
        message={`Apakah Anda yakin ingin menghapus "${deletingItem?.name}"? Data resep terkait dapat terpengaruh.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Bahan Baku Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
