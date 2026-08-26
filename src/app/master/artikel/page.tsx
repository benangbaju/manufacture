'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Link from "next/link";
import { Shirt, Plus, ArrowRight, Sparkles, Pencil, Trash2, X } from 'lucide-react';

interface ArticleItem {
  id: number;
  name: string;
  description: string;
  variants: string[];
}

const initialArticles: ArticleItem[] = [
  { id: 1, name: 'Kemeja Lengan Panjang', description: 'Kemeja kasual pria katun', variants: ['Putih', 'Hitam', 'Navy'] },
  { id: 2, name: 'Celana Chino Pendek', description: 'Bahan katun twill stretch', variants: ['Khaki', 'Hitam'] },
  { id: 3, name: 'Kaos Polos Oversize', description: 'Cotton Combed 24s tebal', variants: ['Putih', 'Hitam', 'Abu-abu'] },
  { id: 4, name: 'Jaket Bomber', description: 'Bahan taslan premium windbreaker', variants: ['Hitam', 'Navy', 'Olive'] },
  { id: 5, name: 'Celana Jogger', description: 'Bahan baby terry elastis', variants: ['Abu-abu', 'Hitam'] },
];

export default function ArtikelPage() {
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleItem | null>(null);

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
    const newArt: ArticleItem = {
      id: newId,
      name: name.trim(),
      description: description.trim() || '-',
      variants: ['Standard'],
    };

    setArticles([...articles, newArt]);
    setModalLines([
      `ID: #${newId}`,
      `Nama Artikel: ${name}`,
      description ? `Deskripsi: ${description}` : 'Tanpa deskripsi',
      `Silakan klik artikel pada tabel untuk menambah varian warnanya.`,
    ]);
    setShowModal(true);
    setName('');
    setDescription('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.name.trim()) return;

    setArticles(prev => prev.map(a => a.id === editingArticle.id ? editingArticle : a));
    setEditingArticle(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingArticle) return;
    setArticles(prev => prev.filter(a => a.id !== deletingArticle.id));
    setDeletingArticle(null);
  };

  return (
    <div>
      <PageHeader 
        title="Katalog 21 Artikel Utama" 
        description="Daftar produk baju induk dan konfigurasi varian warna SKU (mendukung edit & hapus artikel)" 
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
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-3.5 text-[#5a6270] font-mono text-xs">#{a.id}</td>
                    <td className="p-3.5 font-bold text-[#e2e6ed]">
                      <Link href={`/master/artikel/${a.id}`} className="text-white hover:text-slate-200 font-bold flex items-center gap-1.5 transition-colors">
                        <span>{a.name}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="p-3.5 text-[#5a6270] text-xs hidden md:table-cell max-w-xs truncate">{a.description}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {a.variants.map(v => (
                          <span key={v} className="px-2 py-0.5 bg-[#1a2030] border border-[#2a3040] text-[#aab8c8] rounded-md text-[0.65rem] font-semibold">
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/master/artikel/${a.id}`} 
                          className="text-xs px-2.5 py-1 bg-[#1a2030] hover:bg-[#3d5a80] hover:text-[#e2e6ed] text-[#8899aa] rounded-lg border border-[#2a3040] transition-colors inline-block"
                        >
                          Varian &rarr;
                        </Link>
                        <button
                          onClick={() => setEditingArticle(a)}
                          className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                          title="Edit Artikel"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#7a8a9a]" />
                        </button>
                        <button
                          onClick={() => setDeletingArticle(a)}
                          className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
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
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#7a8a9a]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Artikel Baru</h2>
          </div>
          <form className="space-y-4" onSubmit={handleAddArticle}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Artikel *</label>
              <input 
                type="text" 
                required 
                placeholder="Cth: Kemeja Flanel Slimfit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Deskripsi Produk</label>
              <textarea 
                placeholder="Spesifikasi bahan / model..." 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none resize-none"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              Simpan Artikel Baru
            </button>
          </form>
        </div>
      </div>

      {/* Edit Article Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Artikel #{editingArticle.id}</h3>
              </div>
              <button 
                onClick={() => setEditingArticle(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Artikel *</label>
                <input
                  type="text"
                  required
                  value={editingArticle.name}
                  onChange={(e) => setEditingArticle({ ...editingArticle, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={editingArticle.description}
                  onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
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
      {deletingArticle && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Artikel Produk"
          itemName={`#${deletingArticle.id} • ${deletingArticle.name}`}
          details={[
            `Varian terdaftar: ${deletingArticle.variants.join(', ')}`,
            `Deskripsi: ${deletingArticle.description}`,
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingArticle(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Artikel Baru Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
