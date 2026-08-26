'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Scissors, Plus, Pencil, Trash2, X } from 'lucide-react';

interface KainItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
}

const initialData: KainItem[] = [
  { id: 1, name: 'Kain Denim Biru', unit: 'meter', stock: 50 },
  { id: 2, name: 'Kain Katun Putih', unit: 'meter', stock: 80 },
  { id: 3, name: 'Kain Katun Hitam', unit: 'meter', stock: 65 },
  { id: 4, name: 'Kain Katun Navy', unit: 'meter', stock: 40 },
  { id: 5, name: 'Kain Chino Khaki', unit: 'meter', stock: 30 },
  { id: 6, name: 'Kain Parasut Hitam', unit: 'meter', stock: 25 },
  { id: 7, name: 'Kain Baby Terry Abu-abu', unit: 'meter', stock: 45 },
];

export default function KainPage() {
  const [data, setData] = useState<KainItem[]>(initialData);
  const [name, setName] = useState('');
  const [inputUnit, setInputUnit] = useState<'meter' | 'yard'>('meter');
  const [stockInput, setStockInput] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<KainItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<KainItem | null>(null);

  // Conversion logic: 1 yard = 0.9144 meter
  const stockInMeters = inputUnit === 'yard' ? Number((stockInput * 0.9144).toFixed(2)) : stockInput;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || stockInput <= 0) return;

    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    const newItem: KainItem = { id: newId, name: name.trim(), unit: 'meter', stock: stockInMeters };

    setData([...data, newItem]);
    const lines = [
      `Kain: ${name}`,
      inputUnit === 'yard' 
        ? `Input: ${stockInput} yard \u2192 Dikonversi: ${stockInMeters} meter`
        : `Stok awal: ${stockInMeters} meter`,
      `Satuan tersimpan di database: meter`,
    ];
    setModalLines(lines);
    setShowModal(true);
    setName('');
    setStockInput(0);
    setInputUnit('meter');
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
        title="Stok Kain per Warna" 
        description="Master roll kain per varian warna (kain dikelola terpisah karena yield potongnya variatif - mendukung edit & hapus)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330]">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between text-xs text-[#5a6270]">
            <span className="font-semibold text-[#8899aa]">Total: {data.length} Stok Kain</span>
            <span>Total Volume: <strong className="text-[#e2e6ed]">{data.reduce((a, b) => a + b.stock, 0)} meter</strong></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                  <th className="p-3.5">Nama Kain & Warna</th>
                  <th className="p-3.5">Satuan</th>
                  <th className="p-3.5">Stok Aktual</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2330]">
                {data.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-bold text-[#e2e6ed] flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-[#b89860] opacity-80" />
                      <span>{d.name}</span>
                    </td>
                    <td className="p-3.5 text-[#5a6270] text-xs">{d.unit}</td>
                    <td className="p-3.5">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${d.stock < 30 ? 'bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828]' : d.stock < 50 ? 'bg-[#201e1a] text-[#b89860] border border-[#3a3020]' : 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]'}`}>
                        {d.stock} {d.unit}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem(d)}
                          className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                          title="Edit Kain"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#7a8a9a]" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(d)}
                          className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
                          title="Hapus Kain"
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
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Kain Baru</h2>
          </div>
          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Kain & Warna *</label>
              <input 
                type="text" 
                required 
                placeholder="Cth: Kain Linen Sage Green"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Satuan Input</label>
                <select 
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value as 'meter' | 'yard')}
                  className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none appearance-none cursor-pointer"
                >
                  <option value="meter">meter (Standar)</option>
                  <option value="yard">yard (Konversi)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Jumlah ({inputUnit})</label>
                <input 
                  type="number" 
                  min={0} 
                  step={0.1}
                  placeholder="0.0"
                  value={stockInput || ''}
                  onChange={(e) => setStockInput(Number(e.target.value))}
                  className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none" 
                />
              </div>
            </div>

            {inputUnit === 'yard' && stockInput > 0 && (
              <div className="p-2.5 bg-[#151a24] border border-[#2a3848] rounded-xl text-[0.7rem] text-[#aab8c8] flex items-center justify-between">
                <span>Konversi Otomatis:</span>
                <span className="font-bold text-[#6ea87a]">{stockInput} yard &rarr; {stockInMeters} meter</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              Simpan Kain ({stockInMeters} meter)
            </button>
          </form>
        </div>
      </div>

      {/* Edit Kain Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Stok Kain #{editingItem.id}</h3>
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
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Kain & Warna</label>
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
                    <option value="meter">meter</option>
                    <option value="yard">yard</option>
                    <option value="roll">roll</option>
                    <option value="kg">kg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Stok Gudang</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
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
          title="Hapus Stok Kain"
          itemName={`#${deletingItem.id} • ${deletingItem.name}`}
          details={[
            `Satuan: ${deletingItem.unit}`,
            `Stok saat ini: ${deletingItem.stock} ${deletingItem.unit}`,
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Stok Kain Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
