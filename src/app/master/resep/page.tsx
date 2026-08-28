'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Link from 'next/link';
import { 
  getDbRecipes, 
  getDbArticles, 
  getDbRawMaterials, 
  saveDbArticleRecipesBatch,
  deleteDbRecipe 
} from "@/lib/services/db";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  Shirt, 
  Tag, 
  CheckCircle2, 
  ArrowUpDown,
  Sparkles,
  Save,
  Copy,
  Info,
  PackageCheck
} from 'lucide-react';

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
  description?: string;
}

interface MaterialOption {
  id: number;
  name: string;
  unit: string;
  stock_qty?: number;
}

interface EditorRow {
  raw_material_id: number;
  qty_per_unit: number;
}

export default function ResepPage() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected article for multi-item editing
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  
  // Editor state for the selected article
  const [editorRows, setEditorRows] = useState<EditorRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Quick copy from another article
  const [copySourceArticleId, setCopySourceArticleId] = useState<number | ''>('');

  // Modal feedback
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);

  const loadData = async (preferredArticleId?: number) => {
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

      // Select active article
      const targetArticleId = preferredArticleId || selectedArticleId || (articleList && articleList.length > 0 ? articleList[0].id : null);
      setSelectedArticleId(targetArticleId);

      if (targetArticleId && recipeList) {
        const existingItems = recipeList.filter(r => r.article_id === targetArticleId);
        if (existingItems.length > 0) {
          setEditorRows(existingItems.map(item => ({
            raw_material_id: item.raw_material_id,
            qty_per_unit: item.qty_per_piece,
          })));
        } else {
          // Initialize with 1 empty row if no recipe exists
          setEditorRows(materialList && materialList.length > 0 ? [{ raw_material_id: materialList[0].id, qty_per_unit: 1 }] : []);
        }
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

  // When selected article changes, update editor rows
  const handleSelectArticle = (articleId: number) => {
    setSelectedArticleId(articleId);
    const existing = recipes.filter(r => r.article_id === articleId);
    if (existing.length > 0) {
      setEditorRows(existing.map(r => ({
        raw_material_id: r.raw_material_id,
        qty_per_unit: r.qty_per_piece,
      })));
    } else {
      setEditorRows(materials.length > 0 ? [{ raw_material_id: materials[0].id, qty_per_unit: 1 }] : []);
    }
  };

  // Add new component row to current article BOM
  const handleAddRow = () => {
    if (materials.length === 0) return;
    // Pick first material that isn't already in the list if possible
    const usedIds = new Set(editorRows.map(r => r.raw_material_id));
    const availableMat = materials.find(m => !usedIds.has(m.id)) || materials[0];
    setEditorRows(prev => [...prev, { raw_material_id: availableMat.id, qty_per_unit: 1 }]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    setEditorRows(prev => prev.filter((_, idx) => idx !== index));
  };

  // Change row field
  const handleRowChange = (index: number, field: 'raw_material_id' | 'qty_per_unit', val: number) => {
    setEditorRows(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: val } : row));
  };

  // Copy recipe from another article
  const handleCopyRecipe = () => {
    if (!copySourceArticleId) return;
    const sourceRecipes = recipes.filter(r => r.article_id === Number(copySourceArticleId));
    if (sourceRecipes.length === 0) {
      alert('Artikel sumber belum memiliki resep BOM.');
      return;
    }
    setEditorRows(sourceRecipes.map(r => ({
      raw_material_id: r.raw_material_id,
      qty_per_unit: r.qty_per_piece,
    })));
    setCopySourceArticleId('');
  };

  // Save All BOM Components for the selected article
  const handleSaveAll = async () => {
    if (!selectedArticleId) return;

    // Validate duplicates
    const matIds = editorRows.map(r => r.raw_material_id);
    const hasDuplicates = new Set(matIds).size !== matIds.length;
    if (hasDuplicates) {
      alert('Terdapat bahan baku yang sama berulang dalam resep. Harap gabungkan takaran atau pilih bahan yang berbeda.');
      return;
    }

    setIsSaving(true);
    try {
      await saveDbArticleRecipesBatch(selectedArticleId, editorRows);

      const targetArticle = articles.find(a => a.id === selectedArticleId);
      const lines = [
        `Artikel: ${targetArticle?.name || 'Artikel'}`,
        `Total Komponen Tersimpan: ${editorRows.length} jenis aksesoris/bahan`,
      ];

      editorRows.forEach(row => {
        const mat = materials.find(m => m.id === row.raw_material_id);
        if (mat) {
          lines.push(`• ${mat.name}: ${row.qty_per_unit} ${mat.unit} / pcs baju`);
        }
      });

      lines.push('Saat produksi artikel ini dicatat, sistem akan memotong stok seluruh bahan di atas secara otomatis.');

      setModalLines(lines);
      setShowModal(true);
      await loadData(selectedArticleId);
    } catch (err: any) {
      alert('Gagal menyimpan resep: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  // Grouped stats
  const articleMap = new Map<number, RecipeItem[]>();
  recipes.forEach(r => {
    const list = articleMap.get(r.article_id) || [];
    list.push(r);
    articleMap.set(r.article_id, list);
  });

  const filteredArticles = articles.filter(a => 
    a.name.toLowerCase().includes(articleSearch.toLowerCase().trim())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="h-96 rounded-2xl skeleton-shimmer" />
          <div className="lg:col-span-2 h-96 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Resep Produk / Bill of Materials (BOM)" 
        description="Atur seluruh aksesoris rasio-tetap per 1 pcs baju (kancing, label, resleting, hangtag, polybag) yang berlaku untuk artikel produk" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Artikel Ter-Resep</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">
            {articleMap.size} <span className="text-xs font-normal text-[#5a6270]">dari {articles.length} Model</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Formulasi Komponen</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">
            {recipes.length} <span className="text-xs font-normal text-[#5a6270]">Komponen Terpasang</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330] col-span-2 sm:col-span-1">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Bahan Baku Siap Pakai</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">
            {materials.length} <span className="text-xs font-normal text-[#5a6270]">Pilihan Master Aksesoris</span>
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl border-[#1e2330]">
          <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
            <Shirt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada data artikel produk</p>
          <p className="text-xs text-[#5a6270] mt-1 mb-4 max-w-sm mx-auto">
            Silakan daftarkan model artikel produk terlebih dahulu sebelum mengatur formulasi resep BOM.
          </p>
          <Link href="/master/artikel" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3d5a80] text-white rounded-xl text-xs font-bold">
            <Plus className="w-3.5 h-3.5" />
            <span>Daftarkan Artikel di Master Artikel &rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Article Selector List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="glass-card rounded-2xl p-3.5 border-[#1e2330]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.7rem] font-bold text-[#8899aa] uppercase tracking-wider">Pilih Artikel Produk</span>
                <span className="text-[0.65rem] text-[#5a6270]">{articles.length} Model</span>
              </div>

              {/* Search article */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#5a6270] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari artikel..."
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  className="w-full pl-8 pr-6 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
                />
                {articleSearch && (
                  <button onClick={() => setArticleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs">✕</button>
                )}
              </div>

              {/* Article List */}
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredArticles.map(art => {
                  const compCount = (articleMap.get(art.id) || []).length;
                  const isSelected = art.id === selectedArticleId;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => handleSelectArticle(art.id)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                        isSelected 
                          ? 'bg-[#1a2838] border-[#7eb3db] text-white shadow-sm' 
                          : 'bg-[#0c0f17] border-[#1e2330] hover:border-[#2a3848] text-[#b0b8c4]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#3d5a80] text-white' : 'bg-[#121620] text-[#7a8a9a]'
                        }`}>
                          <Shirt className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs truncate">{art.name}</p>
                          <p className="text-[0.65rem] text-[#5a6270] truncate">{art.description || 'Tanpa deskripsi'}</p>
                        </div>
                      </div>

                      <span className={`text-[0.65rem] px-2 py-0.5 rounded-lg font-mono shrink-0 font-semibold ${
                        compCount > 0 
                          ? (isSelected ? 'bg-[#162a20] text-[#8ab896] border border-[#2a4030]' : 'bg-[#1a2030] text-[#7eb3db]') 
                          : 'bg-[#1a1a1a] text-[#5a6270]'
                      }`}>
                        {compCount > 0 ? `${compCount} Bahan` : 'Belum Ada'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanatory Box */}
            <div className="glass-card rounded-2xl p-4 border-[#1e2330] text-xs text-[#8899aa] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Info className="w-4 h-4 text-[#7eb3db]" />
                <span>Prinsip BOM (Resep):</span>
              </div>
              <p className="leading-relaxed text-[0.7rem]">
                BOM berlaku di tingkat <strong>Artikel Produk</strong> (bukan per varian warna) karena kebutuhan kancing, label, hangtag, dan aksesoris sama untuk semua warna dalam 1 model.
              </p>
              <p className="leading-relaxed text-[0.7rem] text-[#5a6270]">
                Untuk kain roll per warna, dikelola secara terpisah di menu <Link href="/master/pemetaan-kain" className="text-[#7eb3db] underline">Pemetaan Kain &rarr;</Link>
              </p>
            </div>
          </div>

          {/* Right Column: Multi-Item BOM Editor */}
          <div className="lg:col-span-8 space-y-4">
            {selectedArticle ? (
              <div className="glass-card rounded-2xl p-5 md:p-6 border-[#1e2330] space-y-5">
                {/* Header of Active Article */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2330]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1a2838] border border-[#2a3848] text-[#7eb3db] flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#e2e6ed] tracking-tight">{selectedArticle.name}</h3>
                      <p className="text-xs text-[#5a6270]">Daftar seluruh kebutuhan bahan baku rasio-tetap untuk 1 pcs baju</p>
                    </div>
                  </div>

                  {/* Copy from another article preset */}
                  {articles.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl px-2 py-1 text-xs">
                      <Copy className="w-3.5 h-3.5 text-[#7eb3db] shrink-0" />
                      <select
                        value={copySourceArticleId}
                        onChange={e => setCopySourceArticleId(e.target.value ? Number(e.target.value) : '')}
                        className="bg-transparent border-none text-[0.7rem] text-[#8899aa] focus:outline-none cursor-pointer"
                      >
                        <option value="">Salin Resep dari Model Lain...</option>
                        {articles.filter(a => a.id !== selectedArticleId).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      {copySourceArticleId && (
                        <button
                          type="button"
                          onClick={handleCopyRecipe}
                          className="px-2 py-0.5 bg-[#3d5a80] text-white font-bold rounded text-[0.65rem] hover:bg-[#4a6d8c]"
                        >
                          Terapkan
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {materials.length === 0 ? (
                  <div className="p-6 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-center text-xs text-[#5a6270]">
                    <p className="text-slate-300 font-semibold mb-2">Belum ada Master Bahan Baku / Aksesoris</p>
                    <Link href="/master/bahan-baku" className="text-[#7eb3db] underline font-medium">Daftarkan kancing, label, resleting di Master Bahan Baku &rarr;</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Multi-Row BOM Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#0c0f17] text-[#5a6270] text-[0.68rem] uppercase tracking-wider border-b border-[#1e2330]">
                            <th className="p-3 w-10 text-center">No</th>
                            <th className="p-3">Nama Aksesoris / Bahan Baku (BOM)</th>
                            <th className="p-3 text-center w-40">Takaran per 1 pcs</th>
                            <th className="p-3 text-center w-28">Satuan</th>
                            <th className="p-3 text-right w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e2330]">
                          {editorRows.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-xs text-[#5a6270]">
                                Belum ada komponen bahan dalam resep artikel ini. Klik tombol <strong>+ Tambah Komponen Bahan</strong> di bawah.
                              </td>
                            </tr>
                          ) : (
                            editorRows.map((row, idx) => {
                              const matObj = materials.find(m => m.id === row.raw_material_id);
                              return (
                                <tr key={idx} className="hover:bg-white/[0.01]">
                                  <td className="p-3 text-center font-mono text-[#5a6270] text-xs">
                                    {idx + 1}
                                  </td>
                                  <td className="p-3">
                                    <select
                                      value={row.raw_material_id}
                                      onChange={e => handleRowChange(idx, 'raw_material_id', Number(e.target.value))}
                                      className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs sm:text-sm text-[#e2e6ed] font-semibold focus:border-[#7eb3db] outline-none"
                                    >
                                      {materials.map(m => (
                                        <option key={m.id} value={m.id}>
                                          {m.name} ({m.unit})
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      required
                                      value={row.qty_per_unit || ''}
                                      onChange={e => handleRowChange(idx, 'qty_per_unit', Number(e.target.value))}
                                      placeholder="1"
                                      className="w-28 p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-center font-mono font-bold text-[#8ab896] text-xs sm:text-sm focus:border-[#7eb3db] outline-none mx-auto block"
                                    />
                                  </td>
                                  <td className="p-3 text-center text-xs font-mono text-[#7eb3db] font-semibold">
                                    {matObj?.unit || 'pcs'}
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveRow(idx)}
                                      className="p-1.5 bg-[#241a1a] hover:bg-[#341e1e] border border-[#3a2020] text-[#c87070] rounded-lg transition-colors"
                                      title="Hapus Baris"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Component Button */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#121620] hover:bg-[#1a2030] border border-[#2a3040] text-[#7eb3db] hover:text-[#9bc7eb] rounded-xl text-xs font-bold transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Komponen Bahan Lain</span>
                      </button>

                      <span className="text-[0.7rem] text-[#5a6270]">
                        Total: <strong className="text-[#e2e6ed]">{editorRows.length}</strong> jenis bahan baku
                      </span>
                    </div>

                    {/* Summary Preview Box */}
                    {editorRows.length > 0 && (
                      <div className="p-4 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[#8ab896] font-bold">
                          <PackageCheck className="w-4 h-4" />
                          <span>Ringkasan Konsumsi per 1 pcs {selectedArticle.name}:</span>
                        </div>
                        <p className="text-[#8899aa] leading-relaxed text-[0.75rem]">
                          {editorRows.map(r => {
                            const m = materials.find(mat => mat.id === r.raw_material_id);
                            return m ? `${r.qty_per_unit} ${m.unit} ${m.name}` : null;
                          }).filter(Boolean).join(' + ')}
                        </p>
                      </div>
                    )}

                    {/* Action Save Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="w-full py-3 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                      >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        <span>{isSaving ? 'Menyimpan Resep...' : `Simpan Semua Resep untuk ${selectedArticle.name}`}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Resep BOM Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
