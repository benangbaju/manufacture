'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Tag, Plus, Pencil, Trash2, X } from 'lucide-react';

interface BahanItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
}

const initialData: BahanItem[] = [
  { id: 1, name: 'Kancing Kemeja Putih', unit: 'pcs', stock: 500 },
  { id: 2, name: 'Kancing Kemeja Hitam', unit: 'pcs', stock: 350 },
  { id: 3, name: 'Label Woven Brand', unit: 'pcs', stock: 800 },
  { id: 4, name: 'Resleting YKK 20cm', unit: 'pcs', stock: 200 },
  { id: 5, name: 'Benang Jahit Putih', unit: 'roll', stock: 25 },
  { id: 6, name: 'Karet Pinggang 3cm', unit: 'meter', stock: 100 },
];

export default function BahanBakuPage() {
  const [data, setData] = useState<BahanItem[]>(initialData);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [stock, setStock] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<BahanItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BahanItem | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    const newItem: BahanItem = { id: newId, name: name.trim(), unit, stock };

    setData([...data, newItem]);
    setModalLines([
      `Bahan Baku: ${name}`,
      `Satuan: ${unit}`,
      `Stok awal: ${stock} ${unit}`,
    ]);
    setShowModal(true);
    setName('');
    setStock(0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    setData(prev => prev.map(d => d.id === editingItem.id ? editingItem : d));
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    setData(prev => prev.filter(d => d.id !== deletingItem.id));
    setDeletingItem(null);
  };

  return (
    <div>
      <PageHeader 
        title="Bahan Baku Rasio-Tetap" 
        description="Master komponen non-kain yang pemakaiannya selalu sama per pcs baju (kancing, label, resleting - mendukung edit & hapus)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330]">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between text-xs text-[#5a6270]">
            <span className="font-semibold text-[#8899aa]">Total: {data.length} Jenis Bahan</span>
          </div>
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
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${d.stock < 100 ? 'bg-[#201e1a] text-[#b89860] border border-[#3a3020]' : 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]'}`}>
                        {d.stock} {d.unit}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem(d)}
                          className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                          title="Edit Bahan"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#7a8a9a]" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(d)}
                          className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
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
        </div>

        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#7a8a9a]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Bahan Baku</h2>
          </div>
          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Bahan *</label>
              <input 
                type="text" 
                required 
                placeholder="Cth: Kancing Kayu 15mm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Satuan</label>
              <select 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none appearance-none cursor-pointer"
              >
                <option value="pcs">pcs</option>
                <option value="roll">roll</option>
                <option value="meter">meter</option>
                <option value="kg">kg</option>
                <option value="lusin">lusin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Stok Awal</label>
              <input 
                type="number" 
                min={0} 
                placeholder="0"
                value={stock || ''}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              Simpan Bahan Baku
            </button>
          </form>
        </div>
      </div>

      {/* Edit Bahan Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Bahan Baku #{editingItem.id}</h3>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
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
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Satuan</label>
                  <select
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                  >
                    <option value="pcs">pcs</option>
                    <option value="roll">roll</option>
                    <option value="meter">meter</option>
                    <option value="kg">kg</option>
                    <option value="lusin">lusin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Stok Gudang</label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
      {deletingItem && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Bahan Baku"
          itemName={`#${deletingItem.id} • ${deletingItem.name}`}
          details={[
            `Satuan: ${deletingItem.unit}`,
            `Stok saat ini: ${deletingItem.stock} ${deletingItem.unit}`,
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Bahan Baku Tersimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
