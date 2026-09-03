'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import BaseModal from "@/components/ui/BaseModal";
import KpiStatCard from "@/components/ui/KpiStatCard";
import SearchInput from "@/components/ui/SearchInput";
import { formatNumber } from "@/lib/utils/formatters";
import Link from 'next/link';
import MasterSubNav from "@/components/ui/MasterSubNav";
import { getDbArticles, createDbArticle, updateDbArticle, deleteDbArticle, createDbVariant, deleteDbVariant } from "@/lib/services/db";
import { Shirt, Plus, Pencil, Trash2, X, AlertCircle, ArrowUpDown, ArrowRight, ChevronRight, Palette, Layers } from 'lucide-react';

interface ArticleItem {
  id: number;
  name: string;
  description: string;
  product_variants?: { id: number; color: string; stock_qty: number; stock_reject_qty: number }[];
}

const POPULAR_COLORS = [
  'Hitam', 'Putih', 'Navy', 'Sage Green', 'Mocca', 'Maroon', 'Cream', 'Khaki', 'Charcoal', 'Lilac'
];

export default function ArtikelPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'stock-desc' | 'stock-asc' | 'variants-desc'>('newest');
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

  const handleToggleColorChip = (color: string) => {
    const list = initialColors.split(',').map(s => s.trim()).filter(Boolean);
    if (list.includes(color)) {
      setInitialColors(list.filter(c => c !== color).join(', '));
    } else {
      setInitialColors([...list, color].join(', '));
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

  // Filter & Sort articles
  const filteredArticles = articles
    .filter(a => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const nameMatch = a.name.toLowerCase().includes(q);
      const descMatch = (a.description || '').toLowerCase().includes(q);
      const variantMatch = (a.product_variants || []).some(v => v.color.toLowerCase().includes(q));
      return nameMatch || descMatch || variantMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'id');
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'id');
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'stock-desc') {
        const stockA = (a.product_variants || []).reduce((acc, v) => acc + (v.stock_qty || 0), 0);
        const stockB = (b.product_variants || []).reduce((acc, v) => acc + (v.stock_qty || 0), 0);
        return stockB - stockA;
      }
      if (sortBy === 'stock-asc') {
        const stockA = (a.product_variants || []).reduce((acc, v) => acc + (v.stock_qty || 0), 0);
        const stockB = (b.product_variants || []).reduce((acc, v) => acc + (v.stock_qty || 0), 0);
        return stockA - stockB;
      }
      if (sortBy === 'variants-desc') {
        return (b.product_variants?.length || 0) - (a.product_variants?.length || 0);
      }
      // default: newest (ID descending)
      return b.id - a.id;
    });

  // Calculate aggregates
  const totalVariants = articles.reduce((acc, a) => acc + (a.product_variants?.length || 0), 0);
  const totalStockReady = articles.reduce((acc, a) => 
    acc + (a.product_variants?.reduce((vAcc, v) => vAcc + (v.stock_qty || 0), 0) || 0), 0
  );
  const totalStockReject = articles.reduce((acc, a) => 
    acc + (a.product_variants?.reduce((vAcc, v) => vAcc + (v.stock_reject_qty || 0), 0) || 0), 0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
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
        title="Master Artikel Produk" 
        description="Daftar produk baju induk dan konfigurasi varian warna SKU (tersimpan real-time di database Supabase)" 
      />

      <MasterSubNav />

      {/* Top Stat Overview Cards via KpiStatCard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiStatCard
          title="Total Model Baju"
          value={<span className="text-[#e2e6ed]">{articles.length} <span className="text-xs font-normal text-[#5a6270]">Artikel</span></span>}
          icon={Shirt}
          iconColor="text-[#7eb3db]"
        />
        <KpiStatCard
          title="Total Varian Warna"
          value={<span className="text-[#7eb3db]">{totalVariants} <span className="text-xs font-normal text-[#5a6270]">SKU</span></span>}
          icon={Palette}
          iconColor="text-[#7eb3db]"
        />
        <KpiStatCard
          title="Stok Siap Jual"
          value={<span className="text-[#8ab896]">{formatNumber(totalStockReady)} <span className="text-xs font-normal text-[#5a6270]">pcs</span></span>}
          icon={Layers}
          iconColor="text-[#8ab896]"
          iconBg="bg-[#1a2a20]"
          iconBorder="border-[#2a3a30]"
        />
        <KpiStatCard
          title="Stok Reject (Afkir)"
          value={<span className="text-[#c8a870]">{formatNumber(totalStockReject)} <span className="text-xs font-normal text-[#5a6270]">pcs</span></span>}
          icon={AlertCircle}
          iconColor="text-[#c8a870]"
          iconBg="bg-[#201e1a]"
          iconBorder="border-[#3a3020]"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col">
          {/* Table Header & Search Bar & Sort Filter */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari artikel atau varian warna..."
              className="flex-1"
            />
            
            {/* Sorting Dropdown & Item Counter */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl px-2.5 py-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#7eb3db] shrink-0" />
                <span className="text-[0.68rem] text-[#8899aa] font-medium hidden sm:inline">Urutan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-[#e2e6ed] outline-none cursor-pointer pr-1"
                >
                  <option value="newest">Terbaru (ID ↓)</option>
                  <option value="oldest">Terlama (ID ↑)</option>
                  <option value="name-asc">Nama Artikel (A - Z)</option>
                  <option value="name-desc">Nama Artikel (Z - A)</option>
                  <option value="stock-desc">Stok Siap Jual (Tertinggi)</option>
                  <option value="stock-asc">Stok Siap Jual (Terendah)</option>
                  <option value="variants-desc">Varian Terbanyak</option>
                </select>
              </div>
              <span className="text-xs text-[#8899aa] font-semibold hidden md:inline">
                {filteredArticles.length} dari {articles.length} Model
              </span>
            </div>
          </div>
          
          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Shirt className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">
                {searchQuery ? 'Tidak ada artikel yang cocok' : 'Belum ada data artikel'}
              </p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Silakan tambahkan artikel pakaian pertama Anda melalui form di samping kanan.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Nama Model</th>
                    <th className="p-3.5 hidden md:table-cell">Deskripsi</th>
                    <th className="p-3.5">Varian Warna & Stok</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {filteredArticles.map(a => {
                    const articleStock = (a.product_variants || []).reduce((acc, v) => acc + (v.stock_qty || 0), 0);
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-3.5 text-[#5a6270] font-mono text-xs">#{a.id}</td>
                        <td className="p-3.5 font-bold text-[#e2e6ed] min-w-[140px]">
                          <Link 
                            href={`/master/artikel/${a.id}`}
                            className="hover:text-[#7eb3db] flex items-center gap-1.5 group/link"
                          >
                            <span className="break-words whitespace-normal leading-snug">{a.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#5a6270] group-hover/link:text-[#7eb3db] group-hover/link:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                          <span className="text-[0.65rem] text-[#5a6270] font-normal block mt-0.5">
                            Total Stok: <strong className="text-[#8ab896] font-mono">{articleStock} pcs</strong>
                          </span>
                        </td>
                        <td className="p-3.5 text-[#8899aa] hidden md:table-cell text-xs break-words">{a.description || '-'}</td>
                        <td className="p-3.5 min-w-[160px]">
                          <div className="flex flex-wrap gap-1.5">
                            {a.product_variants && a.product_variants.length > 0 ? (
                              a.product_variants.map(v => (
                                <span 
                                  key={v.id} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.68rem] bg-[#121822] border border-[#233548] text-[#7eb3db]"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#7eb3db]" />
                                  <span className="font-bold text-[#e2e6ed]">{v.color}</span>
                                  <span className="text-[#8ab896] font-mono font-bold">({v.stock_qty} pcs)</span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Article Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7eb3db] flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Artikel Baru</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Daftarkan model pakaian dan varian warna</p>
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
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
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
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454] resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                  Varian Warna Awal
                </label>
                <span className="text-[0.65rem] text-[#5a6270]">Klik chip untuk tambah</span>
              </div>
              
              {/* Popular Color Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR_COLORS.map(c => {
                  const active = initialColors.split(',').map(s => s.trim()).includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleToggleColorChip(c)}
                      className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-medium transition-all ${
                        active 
                          ? 'bg-[#1a2838] text-[#7eb3db] border border-[#2a3848]' 
                          : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa]'
                      }`}
                    >
                      {active ? `✓ ${c}` : `+ ${c}`}
                    </button>
                  );
                })}
              </div>

              <input 
                type="text" 
                placeholder="Putih, Hitam, Navy"
                value={initialColors}
                onChange={e => setInitialColors(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
              />
              <p className="text-[0.65rem] text-[#5a6270] mt-1">Otomatis membuat varian SKU warna di database</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Artikel Baru'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal via BaseModal */}
      <BaseModal
        isOpen={Boolean(editingArticle)}
        onClose={() => setEditingArticle(null)}
        title={editingArticle ? `Edit Master Artikel #${editingArticle.id}` : ''}
        icon={Pencil}
      >
        {editingArticle && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Nama Artikel</label>
              <input
                type="text"
                required
                value={editingArticle.name}
                onChange={e => setEditingArticle({ ...editingArticle, name: e.target.value })}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">Deskripsi</label>
              <textarea
                rows={3}
                value={editingArticle.description || ''}
                onChange={e => setEditingArticle({ ...editingArticle, description: e.target.value })}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-[#1e2330]">
              <button
                type="button"
                onClick={() => setEditingArticle(null)}
                className="px-4 py-2 bg-[#1a2030] text-[#b0b8c4] rounded-xl text-xs font-semibold hover:bg-[#222a3a] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </BaseModal>

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
