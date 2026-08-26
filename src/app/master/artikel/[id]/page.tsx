'use client';

import { useState, useEffect, use } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Link from "next/link";
import { 
  getDbArticleDetail, 
  getDbFabricStock, 
  createDbVariant, 
  updateDbVariant, 
  deleteDbVariant 
} from "@/lib/services/db";
import { Palette, Layers, Plus, ArrowLeft, Pencil, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface VariantItem {
  id?: number;
  color: string;
  stock_qty: number;
  stock_reject_qty: number;
  variant_fabric_mapping?: { fabric_stock?: { name: string } }[];
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const articleId = Number(resolvedParams.id);
  
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [newColor, setNewColor] = useState('');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [initialRejectStock, setInitialRejectStock] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingVariant, setEditingVariant] = useState<VariantItem | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<VariantItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [art, fab] = await Promise.all([
        getDbArticleDetail(articleId),
        getDbFabricStock(),
      ]);
      setArticle(art);
      setFabrics(fab || []);
    } catch (err) {
      console.error('Failed to load article detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [articleId]);

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColor.trim()) return;

    setIsSubmitting(true);
    try {
      await createDbVariant(articleId, newColor.trim(), initialStock, initialRejectStock);
      setModalLines([
        `Artikel: ${article?.name || ''}`,
        `Varian Baru: ${newColor}`,
        `Stok Siap Jual: ${initialStock} pcs`,
        `Stok Reject: ${initialRejectStock} pcs`,
      ]);
      setShowModal(true);
      setNewColor('');
      setInitialStock(0);
      setInitialRejectStock(0);
      await loadData();
    } catch (err: any) {
      alert('Gagal menambah varian: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant || !editingVariant.id) return;

    try {
      await updateDbVariant(editingVariant.id, editingVariant.color, editingVariant.stock_qty, editingVariant.stock_reject_qty);
      setEditingVariant(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVariant || !deletingVariant.id) return;
    try {
      await deleteDbVariant(deletingVariant.id);
      setDeletingVariant(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus varian: ' + err.message);
    }
  };

  const variants: VariantItem[] = article?.variants || [];
  const totalGoodStock = variants.reduce((a, b) => a + (b.stock_qty || 0), 0);
  const totalRejectStock = variants.reduce((a, b) => a + (b.stock_reject_qty || 0), 0);
  const recipes = article?.recipes || [];

  return (
    <div>
      <PageHeader 
        title={article ? article.name : `Artikel #${articleId}`} 
        description={article?.description ? `${article.description} — Kelola varian warna SKU, stok siap jual & reject` : 'Detail artikel'}
        action={
          <Link 
            href="/master/artikel" 
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] rounded-xl text-xs sm:text-sm text-[#b0b8c4] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Artikel</span>
          </Link>
        }
      />

      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-[#5a6270]">
          Memuat data artikel dan varian dari database...
        </div>
      ) : !article ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-[#c87070]">
          Artikel tidak ditemukan di database.
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Variants Table & BOM Recipe */}
          <div className="lg:col-span-2 space-y-6">
            {/* Variants Table */}
            <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
              <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#7a8a9a]" />
                  <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Daftar Varian Warna ({variants.length} SKU)</h2>
                </div>
                <div className="flex items-center gap-3 text-[0.7rem] font-medium">
                  <span className="text-[#5a6270]">Siap Jual: <strong className="text-[#8ab896]">{totalGoodStock} pcs</strong></span>
                  <span className="text-[#5a6270]">Reject: <strong className="text-[#c8a870]">{totalRejectStock} pcs</strong></span>
                </div>
              </div>

              {variants.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#5a6270]">
                  Belum ada varian warna untuk artikel ini. Tambahkan varian warna di sebelah kanan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                        <th className="p-3.5">Warna Varian</th>
                        <th className="p-3.5">Stok Siap Jual</th>
                        <th className="p-3.5">Stok Reject</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2330]">
                      {variants.map((v) => (
                        <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-bold text-[#e2e6ed]">{v.color}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 font-bold text-[#8ab896] bg-[#1a2a20] px-2.5 py-1 rounded-lg border border-[#2a3040]">
                              <CheckCircle2 className="w-3 h-3" />
                              {v.stock_qty || 0} pcs
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 font-bold text-[#c8a870] bg-[#201e1a] px-2.5 py-1 rounded-lg border border-[#3a3020]">
                              <AlertTriangle className="w-3 h-3 text-[#b89860]" />
                              {v.stock_reject_qty || 0} pcs
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingVariant({ ...v })}
                                className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] transition-colors"
                                title="Edit Varian"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingVariant(v)}
                                className="p-1.5 rounded-lg bg-[#241a1a] hover:bg-[#341e1e] text-[#c87070] border border-[#3a2020] transition-colors"
                                title="Hapus Varian"
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

            {/* Recipe / BOM */}
            <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#7a8a9a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Resep Bahan Rasio-Tetap (BOM Per 1 Pcs)</h2>
              </div>
              {recipes.length === 0 ? (
                <p className="text-xs text-[#5a6270] py-2">
                  Belum ada resep bahan untuk artikel ini. Anda bisa mengatur resep di menu <Link href="/master/resep" className="text-[#8ab896] underline">Master Resep</Link>.
                </p>
              ) : (
                <div className="divide-y divide-[#1e2330] text-xs sm:text-sm">
                  {recipes.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between py-3">
                      <span className="text-[#8899aa] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4a6d8c]"></span>
                        <span>{r.raw_materials?.name || 'Bahan Baku'}</span>
                      </span>
                      <span className="font-bold text-[#e2e6ed] bg-[#0c0f17] px-3 py-1 rounded-lg border border-[#2a3040]">
                        {r.qty_per_unit} {r.raw_materials?.unit || 'pcs'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Add New Variant Form */}
          <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Varian Warna</h2>
                <p className="text-[0.7rem] text-[#5a6270]">Tambahkan SKU warna untuk {article.name}</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleAddVariant}>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Nama Warna (SKU) <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Maroon, Sage Green, Mustard"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                    Stok Awal Siap Jual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                    Stok Awal Reject
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialRejectStock}
                    onChange={(e) => setInitialRejectStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#c8a870] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Varian Warna'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2330]">
              <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Varian Warna</h3>
              <button onClick={() => setEditingVariant(null)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Nama Warna</label>
                <input
                  type="text"
                  required
                  value={editingVariant.color}
                  onChange={(e) => setEditingVariant({ ...editingVariant, color: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Stok Siap Jual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingVariant.stock_qty || 0}
                    onChange={(e) => setEditingVariant({ ...editingVariant, stock_qty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#8ab896] text-xs sm:text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Stok Reject</label>
                  <input
                    type="number"
                    min="0"
                    value={editingVariant.stock_reject_qty || 0}
                    onChange={(e) => setEditingVariant({ ...editingVariant, stock_reject_qty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#c8a870] text-xs sm:text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
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
        isOpen={Boolean(deletingVariant)}
        title="Hapus Varian Warna"
        message={`Apakah Anda yakin ingin menghapus varian warna "${deletingVariant?.color}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingVariant(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal}
        title="Varian Berhasil Dibuat"
        lines={modalLines}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
