'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Link2, Plus, X, Scissors, Pencil, Trash2 } from 'lucide-react';

interface MappingItem {
  id: number;
  article: string;
  variant: string;
  fabric: string;
}

const initialMapping: MappingItem[] = [
  { id: 1, article: 'Kemeja Lengan Panjang', variant: 'Putih', fabric: 'Kain Katun Putih' },
  { id: 2, article: 'Kemeja Lengan Panjang', variant: 'Hitam', fabric: 'Kain Katun Hitam' },
  { id: 3, article: 'Kemeja Lengan Panjang', variant: 'Navy', fabric: 'Kain Katun Navy' },
  { id: 4, article: 'Celana Chino Pendek', variant: 'Khaki', fabric: 'Kain Chino Khaki' },
  { id: 5, article: 'Celana Chino Pendek', variant: 'Hitam', fabric: 'Kain Katun Hitam' },
  { id: 6, article: 'Kaos Polos Oversize', variant: 'Abu-abu', fabric: 'Kain Baby Terry Abu-abu' },
];

const availableArticles = ['Kemeja Lengan Panjang', 'Celana Chino Pendek', 'Kaos Polos Oversize', 'Jaket Bomber', 'Celana Jogger'];
const availableFabrics = ['Kain Katun Putih', 'Kain Katun Hitam', 'Kain Katun Navy', 'Kain Denim Biru', 'Kain Chino Khaki', 'Kain Baby Terry Abu-abu', 'Kain Parasut Hitam'];

export default function PemetaanKainPage() {
  const [mappings, setMappings] = useState<MappingItem[]>(initialMapping);
  const [showAddForm, setShowAddForm] = useState(false);
  const [article, setArticle] = useState('Kemeja Lengan Panjang');
  const [variant, setVariant] = useState('');
  const [fabric, setFabric] = useState('Kain Katun Putih');
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingMap, setEditingMap] = useState<MappingItem | null>(null);
  const [deletingMap, setDeletingMap] = useState<MappingItem | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant.trim()) return;

    const newMap: MappingItem = {
      id: mappings.length > 0 ? Math.max(...mappings.map(m => m.id)) + 1 : 1,
      article,
      variant: variant.trim(),
      fabric,
    };
    setMappings([...mappings, newMap]);
    setModalLines([
      `Artikel: ${article}`,
      `Warna Varian: ${variant}`,
      `Kain Terhubung: ${fabric}`,
      `Saat staf mencatat produksi ${article} - ${variant}, sistem otomatis memotong stok ${fabric}.`,
    ]);
    setShowModal(true);
    setVariant('');
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMap || !editingMap.variant.trim()) return;

    setMappings(prev => prev.map(m => m.id === editingMap.id ? editingMap : m));
    setEditingMap(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingMap) return;
    setMappings(prev => prev.filter(m => m.id !== deletingMap.id));
    setDeletingMap(null);
  };

  return (
    <div>
      <PageHeader 
        title="Pemetaan Kain ke Varian" 
        description="Petakan varian warna baju ke jenis roll kain yang otomatis dipotong saat produksi (mendukung edit & hapus)"
        action={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Tutup Form' : 'Tambah Pemetaan'}</span>
          </button>
        }
      />

      {showAddForm && (
        <div className="glass-card border-[#2a3848] bg-[#151a24] rounded-2xl p-5 mb-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#7a8a9a]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Pemetaan Kain Baru</h2>
          </div>
          <form className="grid sm:grid-cols-3 gap-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Pilih Artikel</label>
              <select
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none appearance-none cursor-pointer"
              >
                {availableArticles.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Warna Varian (SKU) *</label>
              <input
                type="text"
                required
                placeholder="Cth: Maroon, Mocca"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Jenis Kain yang Digunakan</label>
              <select
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none appearance-none cursor-pointer"
              >
                {availableFabrics.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm"
              >
                Simpan Pemetaan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
        <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between text-xs text-[#5a6270]">
          <span className="font-semibold text-[#8899aa]">Total: {mappings.length} Pemetaan Aktif</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                <th className="p-3.5">Artikel Baju</th>
                <th className="p-3.5">Warna Varian</th>
                <th className="p-3.5">Kain yang Dipakai</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2330]">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 font-bold text-[#e2e6ed]">{m.article}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-[#1a2030] border border-[#2a3040] text-[#aab8c8] rounded-md text-xs font-bold">{m.variant}</span>
                  </td>
                  <td className="p-3.5 text-[#8899aa] text-xs font-medium flex items-center gap-1.5 pt-4">
                    <Scissors className="w-3.5 h-3.5 text-[#b89860]" />
                    <span>{m.fabric}</span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30] rounded text-[0.65rem] font-bold uppercase tracking-wider">Terkoneksi</span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingMap(m)}
                        className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                        title="Edit Pemetaan"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#7a8a9a]" />
                      </button>
                      <button
                        onClick={() => setDeletingMap(m)}
                        className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
                        title="Hapus Pemetaan"
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
      </div>

      {/* Edit Mapping Modal */}
      {editingMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Pemetaan Kain #{editingMap.id}</h3>
              </div>
              <button 
                onClick={() => setEditingMap(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Artikel</label>
                <select
                  value={editingMap.article}
                  onChange={(e) => setEditingMap({ ...editingMap, article: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                >
                  {availableArticles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Warna Varian</label>
                <input
                  type="text"
                  required
                  value={editingMap.variant}
                  onChange={(e) => setEditingMap({ ...editingMap, variant: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kain yang Dipakai</label>
                <select
                  value={editingMap.fabric}
                  onChange={(e) => setEditingMap({ ...editingMap, fabric: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                >
                  {availableFabrics.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingMap(null)}
                  className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] transition-all shadow-sm active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMap && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Pemetaan Kain"
          itemName={`${deletingMap.article} - ${deletingMap.variant}`}
          details={[
            `Kain Terhubung: ${deletingMap.fabric}`,
            'Setelah dihapus, pemotongan kain tidak akan otomatis berjalan saat varian ini diproduksi.',
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingMap(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Pemetaan Kain Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
