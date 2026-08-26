'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Link from "next/link";
import { getDbArticles, createDbArticle, updateDbArticle, deleteDbArticle } from "@/lib/services/db";
import { Shirt, Plus, ArrowRight, Sparkles, Pencil, Trash2, X, AlertCircle } from 'lucide-react';

interface ArticleItem {
  id: number;
  name: string;
  description: string;
  product_variants?: { id: number; color: string; stock_qty: number; stock_reject_qty: number }[];
}

export default function ArtikelPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [initialColors, setInitialColors] = useState('Putih, Hitam, Navy');
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getDbArticles();
      setArticles(data || []);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const colors = initialColors.split(',').map(s => s.trim()).filter(Boolean);
      const newArt = await createDbArticle(name.trim(), description.trim(), colors);
      setModalLines([
        `ID: #${newArt.id}`,
        `Nama Artikel: ${newArt.name}`,
        description ? `Deskripsi: ${description}` : 'Tanpa deskripsi',
        colors.length > 0 ? `Varian Warna Awal: ${colors.join(', ')}` : 'Tanpa varian warna awal',
        `Silakan klik artikel pada tabel untuk mengelola varian warnanya.`,
      ]);
      setShowModal(true);
      setName('');
      setDescription('');
      await loadArticles();
    } catch (err: any) {
      alert('Gagal menambah artikel: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.name.trim()) return;

    try {
      await updateDbArticle(editingArticle.id, editingArticle.name, editingArticle.description || '');
      setEditingArticle(null);
      await loadArticles();
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle) return;
    try {
      await deleteDbArticle(deletingArticle.id);
      setDeletingArticle(null);
      await loadArticles();
    } catch (err: any) {
      alert('Gagal menghapus artikel: ' + err.message);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Master Artikel Produk" 
        description="Daftar produk baju induk dan konfigurasi varian warna SKU (tersimpan real-time di database Supabase)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330]">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between text-xs text-[#5a6270]">
            <span className="font-semibold text-[#8899aa]">Total: {articles.length} Artikel</span>
            <span className="text-[0.7rem] text-[#7a8a9a] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Klik nama artikel untuk atur varian warna
            </span>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-xs text-[#5a6270]">Memuat data artikel dari database...</div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Shirt className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada data artikel</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan tambahkan artikel pakaian pertama Anda melalui form di samping kanan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Nama Artikel</th>
                    <th className="p-3.5 hidden md:table-cell">Deskripsi</th>
                    <th className="p-3.5">Varian Warna</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {articles.map(a => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 text-[#5a6270] font-mono text-xs">#{a.id}</td>
                      <td className="p-3.5 font-bold text-[#e2e6ed]">
                        <Link 
                          href={`/master/artikel/${a.id}`}
                          className="hover:text-[#b89860] flex items-center gap-1.5 group/link"
                        >
                          <span>{a.name}</span>
                          <ArrowRight className="w-3 h-3 text-[#5a6270] group-hover/link:text-[#b89860] group-hover/link:translate-x-0.5 transition-all" />
                        </Link>
                      </td>
                      <td className="p-3.5 text-[#8899aa] hidden md:table-cell">{a.description || '-'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {a.product_variants && a.product_variants.length > 0 ? (
                            a.product_variants.map(v => (
                              <span key={v.id} className="px-2 py-0.5 rounded text-[0.65rem] bg-[#1a2030] border border-[#2a3040] text-[#aab8c8]">
                                {v.color}
                              </span>
                            ))
                          ) : (
                            <span className="text-[0.65rem] text-[#5a6270] italic">Belum ada warna</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingArticle(a)}
                            className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] transition-colors"
                            title="Edit Artikel"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingArticle(a)}
                            className="p-1.5 rounded-lg bg-[#241a1a] hover:bg-[#341e1e] text-[#c87070] border border-[#3a2020] transition-colors"
                            title="Hapus Artikel"
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

        {/* Add Article Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Artikel Baru</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Daftarkan nama model pakaian baru</p>
            </div>
          </div>

          <form onSubmit={handleAddArticle} className="space-y-4">
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nama Artikel <span className="text-[#c87070]">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Kemeja Flanel Slim Fit"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454]"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Deskripsi Model / Spesifikasi
              </label>
              <textarea 
                rows={2}
                placeholder="Contoh: Katun flanel premium, kancing hitam"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454] resize-none"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Varian Warna Awal (Pisahkan Koma)
              </label>
              <input 
                type="text" 
                placeholder="Putih, Hitam, Navy"
                value={initialColors}
                onChange={e => setInitialColors(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454]"
              />
              <p className="text-[0.65rem] text-[#5a6270] mt-1">Otomatis membuat varian SKU warna di database</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Artikel Baru'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#2a3040] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2330]">
              <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Master Artikel #{editingArticle.id}</h3>
              <button onClick={() => setEditingArticle(null)} className="text-[#5a6270] hover:text-[#e2e6ed]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Nama Artikel</label>
                <input
                  type="text"
                  required
                  value={editingArticle.name}
                  onChange={e => setEditingArticle({ ...editingArticle, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Deskripsi</label>
                <textarea
                  rows={3}
                  value={editingArticle.description || ''}
                  onChange={e => setEditingArticle({ ...editingArticle, description: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
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
        isOpen={Boolean(deletingArticle)}
        title="Hapus Artikel"
        message={`Apakah Anda yakin ingin menghapus artikel "${deletingArticle?.name}"? Seluruh varian warna dan resep terkait akan ikut terhapus.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingArticle(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal}
        title="Artikel Berhasil Dibuat"
        lines={modalLines}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
