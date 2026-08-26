'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  getDbRecipes, 
  getDbArticles, 
  getDbRawMaterials, 
  saveDbRecipe, 
  deleteDbRecipe 
} from "@/lib/services/db";
import { Layers, Plus, Trash2 } from 'lucide-react';

interface RecipeItem {
  id: number;
  article_id: number;
  raw_material_id: number;
  qty_per_piece: number;
  articles?: { id: number; name: string };
  raw_materials?: { id: number; name: string; unit: string };
}

interface ArticleOption {
  id: number;
  name: string;
}

interface MaterialOption {
  id: number;
  name: string;
  unit: string;
}

export default function ResepPage() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedArticleId, setSelectedArticleId] = useState<number | ''>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);
  
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingItem, setDeletingItem] = useState<RecipeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recipeList, articleList, materialList] = await Promise.all([
        getDbRecipes(),
        getDbArticles(),
        getDbRawMaterials(),
      ]);
      setRecipes(recipeList || []);
      setArticles(articleList || []);
      setMaterials(materialList || []);

      if (articleList && articleList.length > 0 && !selectedArticleId) {
        setSelectedArticleId(articleList[0].id);
      }
      if (materialList && materialList.length > 0 && !selectedMaterialId) {
        setSelectedMaterialId(materialList[0].id);
      }
    } catch (err) {
      console.error('Failed to load recipe data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMaterialToRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticleId || !selectedMaterialId || qty <= 0) return;

    setIsSubmitting(true);
    try {
      await saveDbRecipe(Number(selectedArticleId), Number(selectedMaterialId), qty);
      
      const art = articles.find(a => a.id === Number(selectedArticleId));
      const mat = materials.find(m => m.id === Number(selectedMaterialId));

      setModalLines([
        `Artikel: ${art?.name || ''}`,
        `Bahan ditambahkan: ${mat?.name || ''} (${qty} ${mat?.unit || 'pcs'} / pcs produk)`,
        `Saat produksi ${art?.name || ''} dicatat, sistem otomatis memotong stok bahan ini sesuai jumlah output jadi.`,
      ]);
      setShowModal(true);
      setQty(1);
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan resep: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteDbRecipe(deletingItem.id);
      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus komponen resep: ' + err.message);
    }
  };

  // Group recipes by article
  const groupedRecipes = articles.map(art => {
    const items = recipes.filter(r => r.article_id === art.id);
    return {
      article: art,
      items,
    };
  }).filter(group => group.items.length > 0);

  const selectedMatObj = materials.find(m => m.id === Number(selectedMaterialId));

  return (
    <div>
      <PageHeader 
        title="Resep / Bill of Materials (BOM)" 
        description="Aturan pemakaian bahan baku rasio-tetap per 1 pcs baju (kancing, label, resleting, benang)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#5a6270]">Memuat data resep dari database...</div>
          ) : groupedRecipes.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-2xl border-[#1e2330]">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada resep BOM yang dikonfigurasi</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan pilih artikel dan bahan baku di sebelah kanan untuk menetapkan takaran konsumsi per pcs.
              </p>
            </div>
          ) : (
            groupedRecipes.map(({ article, items }) => (
              <div key={article.id} className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
                <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#e2e6ed] text-sm">{article.name}</h3>
                  </div>
                  <span className="text-[0.7rem] text-[#5a6270]">{items.length} Komponen</span>
                </div>

                <div className="divide-y divide-[#1e2330]">
                  {items.map(item => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div>
                        <p className="font-semibold text-xs text-[#e2e6ed]">{item.raw_materials?.name}</p>
                        <p className="text-[0.65rem] text-[#5a6270]">Kebutuhan: <span className="text-[#8ab896] font-bold">{item.qty_per_piece} {item.raw_materials?.unit || 'pcs'}</span> per pcs baju</p>
                      </div>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 rounded-lg bg-[#241a1a] hover:bg-[#341e1e] text-[#c87070] transition-colors"
                        title="Hapus dari Resep"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Tambah Bahan ke Resep */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Atur Resep BOM</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Hubungkan bahan baku ke artikel</p>
            </div>
          </div>

          {articles.length === 0 || materials.length === 0 ? (
            <p className="text-xs text-[#5a6270] p-4 bg-[#0e1219] rounded-xl border border-[#1e2330]">
              Pastikan Anda sudah membuat minimal 1 Artikel dan 1 Bahan Baku terlebih dahulu.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleAddMaterialToRecipe}>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Pilih Artikel <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={selectedArticleId}
                  onChange={(e) => setSelectedArticleId(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                  required
                >
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Pilih Bahan Baku <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                  required
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Takaran per 1 pcs ({selectedMatObj?.unit || 'pcs'}) <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm font-bold focus:border-[#4a6d8c] outline-none"
                />
                <p className="text-[0.65rem] text-[#5a6270] mt-1">
                  Contoh: Kemeja butuh 6 kancing, celana butuh 0.8 meter karet
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Resep'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Hapus Bahan dari Resep"
        message={`Apakah Anda yakin ingin menghapus komponen ${deletingItem?.raw_materials?.name || ''} dari resep ini?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Resep BOM Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
