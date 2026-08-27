'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  getDbFabricMappings, 
  getDbArticles, 
  getDbFabricStock, 
  saveDbFabricMapping, 
  deleteDbFabricMapping 
} from "@/lib/services/db";
import { Link2, Plus, Trash2, Scissors, Search, ArrowRight, Shirt, ArrowUpDown } from 'lucide-react';

interface MappingRecord {
  id: number;
  article_id: number;
  variant_color: string;
  fabric_stock_id: number;
  articles?: { id: number; name: string };
  fabric_stock?: { id: number; name: string; unit: string };
}

interface ArticleOption {
  id: number;
  name: string;
  variants?: { id: number; color: string }[];
}

interface FabricOption {
  id: number;
  name: string;
  unit: string;
}

export default function PemetaanKainPage() {
  const [mappings, setMappings] = useState<MappingRecord[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [fabrics, setFabrics] = useState<FabricOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'article-asc' | 'article-desc' | 'fabric-asc' | 'color-asc' | 'newest' | 'oldest'>('article-asc');

  const [selectedArticleId, setSelectedArticleId] = useState<number | ''>('');
  const [variantColor, setVariantColor] = useState('');
  const [selectedFabricId, setSelectedFabricId] = useState<number | ''>('');

  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingMap, setDeletingMap] = useState<MappingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mapList, artList, fabList] = await Promise.all([
        getDbFabricMappings(),
        getDbArticles(),
        getDbFabricStock(),
      ]);

      setMappings(mapList || []);
      setArticles(artList || []);
      setFabrics(fabList || []);

      if (artList && artList.length > 0 && !selectedArticleId) {
        setSelectedArticleId(artList[0].id);
        if (artList[0].variants && artList[0].variants.length > 0) {
          setVariantColor(artList[0].variants[0].color);
        }
      }
      if (fabList && fabList.length > 0 && !selectedFabricId) {
        setSelectedFabricId(fabList[0].id);
      }
    } catch (err) {
      console.error('Failed to load fabric mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeArticle = articles.find(a => a.id === Number(selectedArticleId));

  const handleArticleSelect = (artId: number) => {
    setSelectedArticleId(artId);
    const art = articles.find(a => a.id === artId);
    if (art && art.variants && art.variants.length > 0) {
      setVariantColor(art.variants[0].color);
    } else {
      setVariantColor('');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticleId || !variantColor.trim() || !selectedFabricId) return;

    setIsSubmitting(true);
    try {
      await saveDbFabricMapping(
        Number(selectedArticleId),
        variantColor.trim(),
        Number(selectedFabricId)
      );

      const art = articles.find(a => a.id === Number(selectedArticleId));
      const fab = fabrics.find(f => f.id === Number(selectedFabricId));

      setModalLines([
        `Artikel: ${art?.name || ''}`,
        `Warna Varian: ${variantColor.trim()}`,
        `Kain Terhubung: ${fab?.name || ''}`,
        `Saat staf mencatat produksi batch ${art?.name || ''} warna ${variantColor}, stok ${fab?.name || ''} akan otomatis terpotong.`,
      ]);
      setShowModal(true);
      setVariantColor('');
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan pemetaan kain: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMap) return;
    try {
      await deleteDbFabricMapping(deletingMap.id);
      setDeletingMap(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus pemetaan: ' + err.message);
    }
  };

  // Filtered & Sorted mappings
  const filteredMappings = mappings
    .filter(m => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const artName = (m.articles?.name || '').toLowerCase();
      const color = (m.variant_color || '').toLowerCase();
      const fabName = (m.fabric_stock?.name || '').toLowerCase();
      return artName.includes(q) || color.includes(q) || fabName.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'article-asc') return (a.articles?.name || '').localeCompare(b.articles?.name || '', 'id');
      if (sortBy === 'article-desc') return (b.articles?.name || '').localeCompare(a.articles?.name || '', 'id');
      if (sortBy === 'fabric-asc') return (a.fabric_stock?.name || '').localeCompare(b.fabric_stock?.name || '', 'id');
      if (sortBy === 'color-asc') return (a.variant_color || '').localeCompare(b.variant_color || '', 'id');
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      return (a.articles?.name || '').localeCompare(b.articles?.name || '', 'id');
    });

  const uniqueArticlesMapped = new Set(mappings.map(m => m.article_id)).size;
  const uniqueFabricsMapped = new Set(mappings.map(m => m.fabric_stock_id)).size;

  // Unmapped Variants Detection
  const allVariants = articles.flatMap(a => 
    (a.variants || []).map(v => ({
      articleId: a.id,
      articleName: a.name,
      color: v.color,
    }))
  );

  const unmappedVariants = allVariants.filter(v => 
    !mappings.some(m => m.article_id === v.articleId && m.variant_color.toLowerCase() === v.color.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
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
        title="Pemetaan Kain ke Varian" 
        description="Hubungkan varian warna artikel ke jenis roll kain yang otomatis dipotong saat produksi berlangsung" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Pemetaan Aktif</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">{mappings.length} <span className="text-xs font-normal text-[#5a6270]">Relasi</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Artikel Terpetakan</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">{uniqueArticlesMapped} <span className="text-xs font-normal text-[#5a6270]">dari {articles.length} Model</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330] col-span-2 sm:col-span-1">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Kain Roll Terhubung</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">{uniqueFabricsMapped} <span className="text-xs font-normal text-[#5a6270]">dari {fabrics.length} Jenis</span></p>
        </div>
      </div>

      {/* Unmapped Variants Alert Banner */}
      {unmappedVariants.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#1f1a14] border border-[#3a2c1a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#c8a870] flex items-center gap-2">
              <span>⚠️ Ada {unmappedVariants.length} varian warna belum memiliki pemetaan kain roll</span>
            </span>
            <span className="text-[0.65rem] text-[#8899aa]">Klik untuk memilih otomatis:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {unmappedVariants.slice(0, 10).map((uv, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedArticleId(uv.articleId);
                  setVariantColor(uv.color);
                }}
                className="px-2.5 py-1 bg-[#12100d] hover:bg-[#251e14] border border-[#443218] text-[#e2c088] rounded-xl text-xs font-medium transition-all"
              >
                + {uv.articleName} ({uv.color})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col">
          {/* Header with Search & Sort Filter */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari artikel, warna, atau kain..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sorting Dropdown & Counter */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl px-2.5 py-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#7eb3db] shrink-0" />
                <span className="text-[0.68rem] text-[#8899aa] font-medium hidden sm:inline">Urutan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-[#e2e6ed] outline-none cursor-pointer pr-1"
                >
                  <option value="article-asc">Nama Artikel (A - Z)</option>
                  <option value="article-desc">Nama Artikel (Z - A)</option>
                  <option value="fabric-asc">Jenis Kain (A - Z)</option>
                  <option value="color-asc">Warna Varian (A - Z)</option>
                  <option value="newest">Terbaru Ditambahkan</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>
              <span className="text-xs text-[#8899aa] font-semibold hidden md:inline">
                {filteredMappings.length} dari {mappings.length} Pemetaan
              </span>
            </div>
          </div>

          {filteredMappings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Link2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">
                {searchQuery ? 'Tidak ada pemetaan yang cocok' : 'Belum ada pemetaan kain'}
              </p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan hubungkan warna baju ke roll kain melalui formulir di samping kanan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">Artikel & Warna</th>
                    <th className="p-3.5 text-center">Koneksi</th>
                    <th className="p-3.5">Kain Roll Terpotong</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {filteredMappings.map(m => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-[#e2e6ed] block">{m.articles?.name}</span>
                        <span className="inline-flex items-center gap-1 text-[0.7rem] text-[#7eb3db] font-semibold mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7eb3db]"></span>
                          {m.variant_color}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="w-6 h-6 rounded-full bg-[#121822] border border-[#233548] text-[#7eb3db] flex items-center justify-center mx-auto">
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#8ab896] bg-[#1a2a20] px-2.5 py-1 rounded-lg border border-[#2a3828] text-xs">
                          <Scissors className="w-3 h-3 text-[#6ea87a]" />
                          {m.fabric_stock?.name}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeletingMap(m)}
                          className="p-1.5 rounded-lg bg-[#241a1a] hover:bg-[#341e1e] text-[#c87070] border border-[#3a2020] transition-colors"
                          title="Hapus Pemetaan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Mapping Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7eb3db] flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Hubungkan Kain</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Petakan warna varian ke stok roll kain</p>
            </div>
          </div>

          {articles.length === 0 || fabrics.length === 0 ? (
            <p className="text-xs text-[#5a6270] p-4 bg-[#0e1219] rounded-xl border border-[#1e2330]">
              Pastikan Anda sudah memiliki minimal 1 Artikel dan 1 Stok Kain terlebih dahulu.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleAdd}>
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Pilih Artikel <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={selectedArticleId}
                  onChange={(e) => handleArticleSelect(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium cursor-pointer"
                  required
                >
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider">
                    Nama Warna Varian <span className="text-[#c87070]">*</span>
                  </label>
                  <span className="text-[0.65rem] text-[#5a6270]">Pilih atau ketik warna</span>
                </div>

                {/* Varian Color Quick Chips */}
                {activeArticle?.variants && activeArticle.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {activeArticle.variants.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantColor(v.color)}
                        className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-semibold transition-all border ${
                          variantColor.toLowerCase() === v.color.toLowerCase()
                            ? 'bg-[#121822] text-[#7eb3db] border-[#233548] ring-1 ring-[#7eb3db]'
                            : 'bg-[#0c0f17] text-[#8899aa] border-[#1e2330] hover:bg-[#1a2030]'
                        }`}
                      >
                        {v.color}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  required
                  placeholder="Contoh: Putih, Hitam, Navy"
                  value={variantColor}
                  onChange={(e) => setVariantColor(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Pilih Roll Kain yang Terpotong <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={selectedFabricId}
                  onChange={(e) => setSelectedFabricId(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium cursor-pointer"
                  required
                >
                  {fabrics.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pemetaan Kain'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingMap)}
        title="Hapus Pemetaan Kain"
        message={`Apakah Anda yakin ingin menghapus relasi untuk "${deletingMap?.articles?.name} - ${deletingMap?.variant_color}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingMap(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Pemetaan Kain Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
