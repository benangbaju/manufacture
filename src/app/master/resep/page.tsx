'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Layers, Plus, X, Pencil, Trash2 } from 'lucide-react';

interface MaterialRecipe {
  id: number;
  name: string;
  qty: number;
  unit: string;
}

interface RecipeGroup {
  article: string;
  materials: MaterialRecipe[];
}

const initialRecipes: RecipeGroup[] = [
  {
    article: 'Kemeja Lengan Panjang',
    materials: [
      { id: 1, name: 'Kancing Kemeja Putih', qty: 6, unit: 'pcs' },
      { id: 2, name: 'Label Woven Brand', qty: 1, unit: 'pcs' },
    ],
  },
  {
    article: 'Celana Chino Pendek',
    materials: [
      { id: 3, name: 'Kancing Kemeja Hitam', qty: 1, unit: 'pcs' },
      { id: 4, name: 'Resleting YKK 20cm', qty: 1, unit: 'pcs' },
      { id: 5, name: 'Label Woven Brand', qty: 1, unit: 'pcs' },
      { id: 6, name: 'Karet Pinggang 3cm', qty: 0.8, unit: 'meter' },
    ],
  },
  {
    article: 'Kaos Polos Oversize',
    materials: [
      { id: 7, name: 'Label Woven Brand', qty: 1, unit: 'pcs' },
    ],
  },
  {
    article: 'Jaket Bomber',
    materials: [
      { id: 8, name: 'Resleting YKK 20cm', qty: 1, unit: 'pcs' },
      { id: 9, name: 'Label Woven Brand', qty: 1, unit: 'pcs' },
      { id: 10, name: 'Kancing Kemeja Hitam', qty: 2, unit: 'pcs' },
    ],
  },
];

const availableArticles = ['Kemeja Lengan Panjang', 'Celana Chino Pendek', 'Kaos Polos Oversize', 'Jaket Bomber', 'Celana Jogger'];
const availableMaterials = ['Kancing Kemeja Putih', 'Kancing Kemeja Hitam', 'Label Woven Brand', 'Resleting YKK 20cm', 'Karet Pinggang 3cm', 'Benang Jahit Putih'];

export default function ResepPage() {
  const [recipes, setRecipes] = useState<RecipeGroup[]>(initialRecipes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState('Kemeja Lengan Panjang');
  const [materialName, setMaterialName] = useState('Kancing Kemeja Putih');
  const [qty, setQty] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  
  const [editingItem, setEditingItem] = useState<{ article: string; mat: MaterialRecipe } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ article: string; mat: MaterialRecipe } | null>(null);

  const handleAddMaterialToRecipe = (e: React.FormEvent) => {
    e.preventDefault();

    const existing = recipes.find(r => r.article === selectedArticle);
    const newId = Date.now();
    const newMatItem: MaterialRecipe = { id: newId, name: materialName, qty, unit };

    if (existing) {
      const updated = recipes.map(r => {
        if (r.article === selectedArticle) {
          return {
            ...r,
            materials: [...r.materials, newMatItem],
          };
        }
        return r;
      });
      setRecipes(updated);
    } else {
      setRecipes([...recipes, { article: selectedArticle, materials: [newMatItem] }]);
    }

    setModalLines([
      `Artikel: ${selectedArticle}`,
      `Bahan ditambahkan: ${materialName} (${qty} ${unit} / pcs)`,
      `Saat staf memproduksi ${selectedArticle}, sistem otomatis mengalikan ${qty} ${unit} dengan total output jadi.`,
    ]);
    setShowModal(true);
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setRecipes(prev => prev.map(r => {
      if (r.article === editingItem.article) {
        return {
          ...r,
          materials: r.materials.map(m => m.id === editingItem.mat.id ? editingItem.mat : m)
        };
      }
      return r;
    }));

    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;

    setRecipes(prev => prev.map(r => {
      if (r.article === deletingItem.article) {
        return {
          ...r,
          materials: r.materials.filter(m => m.id !== deletingItem.mat.id)
        };
      }
      return r;
    }).filter(r => r.materials.length > 0));

    setDeletingItem(null);
  };

  return (
    <div>
      <PageHeader 
        title="Resep Bahan Baku (BOM)" 
        description="Atur kebutuhan bahan rasio-tetap per 1 pcs baju (kancing, label, resleting, benang - mendukung edit & hapus)"
        action={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Tutup Form' : 'Tambah Bahan ke Resep'}</span>
          </button>
        }
      />

      {showAddForm && (
        <div className="glass-card border-[#2a3848] bg-[#151a24] rounded-2xl p-5 mb-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#7a8a9a]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Bahan ke Resep Artikel</h2>
          </div>
          <form className="grid sm:grid-cols-4 gap-4" onSubmit={handleAddMaterialToRecipe}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Artikel Baju</label>
              <select
                value={selectedArticle}
                onChange={(e) => setSelectedArticle(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
              >
                {availableArticles.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Bahan Baku</label>
              <select
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
              >
                {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kebutuhan per 1 Pcs</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={qty || ''}
                onChange={(e) => setQty(Number(e.target.value))}
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
                <option value="meter">meter</option>
                <option value="roll">roll</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm"
              >
                Simpan ke Resep
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {recipes.map(recipe => (
          <div key={recipe.article} className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
            <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#e2e6ed] text-sm sm:text-base tracking-tight">{recipe.article}</h3>
              </div>
              <span className="text-[0.7rem] bg-[#1a2030] border border-[#2a3040] text-[#aab8c8] px-2.5 py-0.5 rounded-full font-semibold">
                {recipe.materials.length} Bahan Baku
              </span>
            </div>
            <div className="divide-y divide-[#1e2330]">
              {recipe.materials.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3.5 md:px-5 hover:bg-white/[0.02] transition-colors text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-[#b0b8c4]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6b8aaf]"></span>
                    <span className="font-medium">{mat.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[#e2e6ed] font-bold bg-[#0c0f17] px-3 py-1 rounded-lg border border-[#2a3040] text-xs">
                      {mat.qty} {mat.unit} / pcs
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem({ article: recipe.article, mat })}
                        className="p-1 rounded-md bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                        title="Edit Bahan"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#7a8a9a]" />
                      </button>
                      <button
                        onClick={() => setDeletingItem({ article: recipe.article, mat })}
                        className="p-1 rounded-md bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
                        title="Hapus dari Resep"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Recipe Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Bahan Resep BOM</h3>
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
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Artikel</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.article}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[#5a6270] text-xs font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Bahan</label>
                <select
                  value={editingItem.mat.name}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    mat: { ...editingItem.mat, name: e.target.value }
                  })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                >
                  {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kebutuhan per Pcs</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingItem.mat.qty}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      mat: { ...editingItem.mat, qty: Number(e.target.value) }
                    })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Satuan</label>
                  <select
                    value={editingItem.mat.unit}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      mat: { ...editingItem.mat, unit: e.target.value }
                    })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                  >
                    <option value="pcs">pcs</option>
                    <option value="meter">meter</option>
                    <option value="roll">roll</option>
                    <option value="kg">kg</option>
                  </select>
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
          title="Hapus Bahan dari Resep"
          itemName={`${deletingItem.mat.name} (${deletingItem.mat.qty} ${deletingItem.mat.unit}/pcs)`}
          details={[
            `Artikel: ${deletingItem.article}`,
            'Bahan ini tidak akan lagi otomatis dikurangkan dari gudang saat mencatat produksi artikel ini.',
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Resep Bahan Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
