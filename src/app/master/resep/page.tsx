'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Link from 'next/link';
import { 
  getDbRecipes, 
  getDbArticles, 
  getDbRawMaterials, 
  saveDbVariantRecipesBatch,
  applyDbVariantRecipeToAllVariants
} from "@/lib/services/db";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  Shirt, 
  Tag, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  Copy, 
  Info, 
  PackageCheck,
  Palette,
  ArrowRight,
  Share2
} from 'lucide-react';

interface RecipeItem {
  id: number;
  article_id: number;
  variant_id?: number;
  raw_material_id: number;
  qty_per_piece: number;
  articles?: { id: number; name: string };
  variants?: { id: number; color: string };
  raw_materials?: { id: number; name: string; unit: string };
}

interface VariantOption {
  id: number;
  article_id: number;
  color: string;
  stock_qty?: number;
}

interface ArticleOption {
  id: number;
  name: string;
  description?: string;
  product_variants?: VariantOption[];
  variants?: VariantOption[];
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

  // Active selection
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [articleSearch, setArticleSearch] = useState('');

  // Multi-item editor rows for active variant
  const [editorRows, setEditorRows] = useState<EditorRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Copy options
  const [copySourceVariantId, setCopySourceVariantId] = useState<number | ''>('');

  // Modal feedback
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);

  const loadData = async (preferredVariantId?: number, preferredArticleId?: number) => {
    setLoading(true);
    try {
      const [recipeList, articleList, materialList] = await Promise.all([
        getDbRecipes(),
        getDbArticles(),
        getDbRawMaterials(),
      ]);

      const validRecipes = recipeList || [];
      const validArticles = articleList || [];
      const validMaterials = materialList || [];

      setRecipes(validRecipes);
      setArticles(validArticles);
      setMaterials(validMaterials);

      // Determine active article & variant
      let activeArtId = preferredArticleId || selectedArticleId;
      if (!activeArtId && validArticles.length > 0) {
        activeArtId = validArticles[0].id;
      }
      setSelectedArticleId(activeArtId);

      const activeArt = validArticles.find(a => a.id === activeArtId);
      const artVariants = activeArt?.variants || activeArt?.product_variants || [];

      let activeVarId = preferredVariantId || selectedVariantId;
      if ((!activeVarId || !artVariants.some((v: VariantOption) => v.id === activeVarId)) && artVariants.length > 0) {
        activeVarId = artVariants[0].id;
      }
      setSelectedVariantId(activeVarId);

      if (activeVarId) {
        loadVariantRecipesIntoEditor(activeVarId, validRecipes, validMaterials, validArticles);
      }
    } catch (err: any) {
      console.error('Failed to load recipe data:', err);
      alert('Gagal memuat data resep: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadVariantRecipesIntoEditor = (
    variantId: number, 
    recipeList: RecipeItem[], 
    materialList: MaterialOption[], 
    articleList?: ArticleOption[]
  ) => {
    // 1. Check variant specific recipes first
    const varItems = recipeList.filter(r => r.variant_id === variantId);
    if (varItems.length > 0) {
      setEditorRows(varItems.map(item => ({
        raw_material_id: item.raw_material_id,
        qty_per_unit: item.qty_per_piece,
      })));
      return;
    }

    // 2. Fallback to article level if any
    const activeArtList = articleList && articleList.length > 0 ? articleList : articles;
    const activeArt = activeArtList.find(a => (a.variants || a.product_variants || []).some((v: VariantOption) => v.id === variantId));
    if (activeArt) {
      const artItems = recipeList.filter(r => r.article_id === activeArt.id && !r.variant_id);
      if (artItems.length > 0) {
        setEditorRows(artItems.map(item => ({
          raw_material_id: item.raw_material_id,
          qty_per_unit: item.qty_per_piece,
        })));
        return;
      }
    }

    // 3. Default row
    setEditorRows(materialList.length > 0 ? [{ raw_material_id: materialList[0].id, qty_per_unit: 1 }] : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // When user selects a different article
  const handleSelectArticle = (artId: number) => {
    setSelectedArticleId(artId);
    const art = articles.find(a => a.id === artId);
    const artVars = art?.variants || art?.product_variants || [];
    if (artVars.length > 0) {
      setSelectedVariantId(artVars[0].id);
      loadVariantRecipesIntoEditor(artVars[0].id, recipes, materials, articles);
    } else {
      setSelectedVariantId(null);
      setEditorRows([]);
    }
  };

  // When user selects a specific variant color
  const handleSelectVariant = (varId: number, artId?: number) => {
    setSelectedVariantId(varId);
    if (artId) setSelectedArticleId(artId);
    loadVariantRecipesIntoEditor(varId, recipes, materials, articles);
  };

  // Add component row
  const handleAddRow = () => {
    if (materials.length === 0) return;
    const usedIds = new Set(editorRows.map(r => r.raw_material_id));
    const availableMat = materials.find(m => !usedIds.has(m.id)) || materials[0];
    setEditorRows(prev => [...prev, { raw_material_id: availableMat.id, qty_per_unit: 1 }]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    setEditorRows(prev => prev.filter((_, idx) => idx !== index));
  };

  // Change row value
  const handleRowChange = (index: number, field: 'raw_material_id' | 'qty_per_unit', val: number) => {
    setEditorRows(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: val } : row));
  };

  // Copy recipe from another variant color
  const handleCopyRecipe = () => {
    if (!copySourceVariantId) return;
    const sourceItems = recipes.filter(r => r.variant_id === Number(copySourceVariantId));
    if (sourceItems.length === 0) {
      alert('Varian sumber belum memiliki resep BOM.');
      return;
    }
    setEditorRows(sourceItems.map(r => ({
      raw_material_id: r.raw_material_id,
      qty_per_unit: r.qty_per_piece,
    })));
    setCopySourceVariantId('');
  };

  // Save BOM for current variant
  const handleSaveVariant = async () => {
    if (!selectedVariantId || !selectedArticleId) return;

    if (editorRows.length === 0) {
      alert('Resep harus memiliki minimal 1 komponen bahan baku.');
      return;
    }

    const invalidQty = editorRows.some(r => !r.qty_per_unit || r.qty_per_unit <= 0);
    if (invalidQty) {
      alert('Takaran bahan per pcs baju harus lebih dari 0.');
      return;
    }

    // Validate duplicate materials
    const matIds = editorRows.map(r => r.raw_material_id);
    if (new Set(matIds).size !== matIds.length) {
      alert('Terdapat bahan baku yang sama berulang dalam resep. Harap gabungkan takaran atau pilih bahan yang berbeda.');
      return;
    }

    setIsSaving(true);
    try {
      await saveDbVariantRecipesBatch(selectedVariantId, editorRows, selectedArticleId);

      const activeArt = articles.find(a => a.id === selectedArticleId);
      const activeVar = (activeArt?.variants || activeArt?.product_variants || []).find(v => v.id === selectedVariantId);

      const lines = [
        `Produk: ${activeArt?.name || 'Artikel'} — Warna: ${activeVar?.color || ''}`,
        `Total Komponen Tersimpan: ${editorRows.length} jenis aksesoris/bahan`,
      ];

      editorRows.forEach(row => {
        const mat = materials.find(m => m.id === row.raw_material_id);
        if (mat) {
          lines.push(`• ${mat.name}: ${row.qty_per_unit} ${mat.unit} / pcs baju`);
        }
      });

      lines.push('Saat batch produksi varian warna ini dicatat, sistem otomatis memotong stok bahan-bahan di atas.');

      setModalLines(lines);
      setShowModal(true);
      await loadData(selectedVariantId, selectedArticleId);
    } catch (err: any) {
      alert('Gagal menyimpan resep varian: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Apply this recipe to all variants of current article
  const handleApplyToAllVariants = async () => {
    if (!selectedArticleId) return;
    const activeArt = articles.find(a => a.id === selectedArticleId);
    const artVars = activeArt?.variants || activeArt?.product_variants || [];
    if (artVars.length === 0) return;

    if (editorRows.length === 0) {
      alert('Resep harus memiliki minimal 1 komponen bahan baku.');
      return;
    }

    const invalidQty = editorRows.some(r => !r.qty_per_unit || r.qty_per_unit <= 0);
    if (invalidQty) {
      alert('Takaran bahan per pcs baju harus lebih dari 0.');
      return;
    }

    const matIds = editorRows.map(r => r.raw_material_id);
    if (new Set(matIds).size !== matIds.length) {
      alert('Terdapat bahan baku yang sama berulang dalam resep. Harap gabungkan takaran atau pilih bahan yang berbeda.');
      return;
    }

    const confirmed = window.confirm(
      `Terapkan susunan resep ini (${editorRows.length} komponen) ke SELURUH (${artVars.length}) varian warna dari "${activeArt?.name}"? Resep masing-masing warna (${artVars.map(v => v.color).join(', ')}) akan disamakan.`
    );
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await applyDbVariantRecipeToAllVariants(selectedArticleId, editorRows);

      setModalLines([
        `Artikel: ${activeArt?.name || ''}`,
        `Resep berhasil diterapkan ke ${artVars.length} varian warna (${artVars.map(v => v.color).join(', ')})`,
        `Setiap warna kini memiliki formulasi ${editorRows.length} komponen bahan baku yang sama.`,
      ]);
      setShowModal(true);
      await loadData(selectedVariantId || undefined, selectedArticleId);
    } catch (err: any) {
      alert('Gagal menerapkan resep ke semua varian: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper getters
  const activeArticle = articles.find(a => a.id === selectedArticleId);
  const activeVariants = activeArticle?.variants || activeArticle?.product_variants || [];
  const activeVariant = activeVariants.find(v => v.id === selectedVariantId);

  // Variant recipe map for quick count
  const variantRecipeMap = new Map<number, RecipeItem[]>();
  recipes.forEach(r => {
    if (r.variant_id) {
      const list = variantRecipeMap.get(r.variant_id) || [];
      list.push(r);
      variantRecipeMap.set(r.variant_id, list);
    }
  });

  // Filtered articles
  const filteredArticles = articles.filter(a =>
    a.name.toLowerCase().includes(articleSearch.toLowerCase().trim()) ||
    (a.variants || a.product_variants || []).some(v => v.color.toLowerCase().includes(articleSearch.toLowerCase().trim()))
  );

  // All variants list for copy dropdown
  const allVariantsWithRecipes: { id: number; label: string }[] = [];
  articles.forEach(art => {
    (art.variants || art.product_variants || []).forEach(v => {
      if (v.id !== selectedVariantId && (variantRecipeMap.get(v.id) || []).length > 0) {
        allVariantsWithRecipes.push({
          id: v.id,
          label: `${art.name} (${v.color})`,
        });
      }
    });
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-96 rounded-2xl skeleton-shimmer" />
          <div className="lg:col-span-8 h-96 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Resep Produk / Bill of Materials (BOM) per Varian" 
        description="Atur seluruh aksesoris rasio-tetap per varian warna (misal: Baju Putih pakai kancing putih, Baju Hitam pakai kancing hitam)" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Varian Warna Ter-Resep</span>
          <p className="text-xl sm:text-2xl font-black text-[#e2e6ed] font-mono">
            {variantRecipeMap.size} <span className="text-xs font-normal text-[#5a6270]">SKU Varian</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Total Formulasi Terpasang</span>
          <p className="text-xl sm:text-2xl font-black text-[#7eb3db] font-mono">
            {recipes.length} <span className="text-xs font-normal text-[#5a6270]">Komponen</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-[#1e2330] col-span-2 sm:col-span-1">
          <span className="text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider block mb-1">Pilihan Bahan Baku / Aksesoris</span>
          <p className="text-xl sm:text-2xl font-black text-[#8ab896] font-mono">
            {materials.length} <span className="text-xs font-normal text-[#5a6270]">Master Bahan</span>
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl border-[#1e2330]">
          <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
            <Shirt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada artikel produk terdaftar</p>
          <p className="text-xs text-[#5a6270] mt-1 mb-4 max-w-sm mx-auto">
            Silakan daftarkan model artikel dan varian warna terlebih dahulu sebelum mengatur formulasi resep BOM.
          </p>
          <Link href="/master/artikel" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3d5a80] text-white rounded-xl text-xs font-bold">
            <Plus className="w-3.5 h-3.5" />
            <span>Daftarkan Artikel di Master Artikel &rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: 2-Step Selector (Artikel -> Varian Warna) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card rounded-2xl p-4 border-[#1e2330]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.7rem] font-bold text-[#8899aa] uppercase tracking-wider">Pilih Model & Varian Warna</span>
                <span className="text-[0.65rem] text-[#5a6270]">{articles.length} Model</span>
              </div>

              {/* Search article or color */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-[#5a6270] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari artikel atau warna..."
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  className="w-full pl-8 pr-6 py-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
                />
                {articleSearch && (
                  <button onClick={() => setArticleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs">✕</button>
                )}
              </div>

              {/* Article Accordion / List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredArticles.map(art => {
                  const artVars = art.variants || art.product_variants || [];
                  const isArtSelected = art.id === selectedArticleId;

                  return (
                    <div 
                      key={art.id} 
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isArtSelected 
                          ? 'border-[#2a3c50] bg-[#121822]' 
                          : 'border-[#1e2330] bg-[#0c0f17] hover:border-[#2a3848]'
                      }`}
                    >
                      {/* Article Header */}
                      <button
                        type="button"
                        onClick={() => handleSelectArticle(art.id)}
                        className="w-full p-2.5 text-left flex items-center justify-between transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isArtSelected ? 'bg-[#3d5a80] text-white' : 'bg-[#1a2030] text-[#7a8a9a]'
                          }`}>
                            <Shirt className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-xs text-[#e2e6ed] break-words whitespace-normal leading-snug">{art.name}</span>
                        </div>
                        <span className="text-[0.65rem] text-[#5a6270] shrink-0 font-mono">
                          {artVars.length} Warna
                        </span>
                      </button>

                      {/* Variant Colors List (Shown if article is selected) */}
                      {isArtSelected && artVars.length > 0 && (
                        <div className="p-2 pt-0 space-y-1 border-t border-[#1e2838]/60 mt-1">
                          {artVars.map(v => {
                            const isVarSelected = v.id === selectedVariantId;
                            const compCount = (variantRecipeMap.get(v.id) || []).length;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleSelectVariant(v.id, art.id)}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-all border gap-2 ${
                                  isVarSelected
                                    ? 'bg-[#1a2838] border-[#7eb3db] text-[#e2e6ed] font-bold shadow-sm'
                                    : 'bg-[#0c0f17] border-transparent hover:border-[#1e2838] text-[#8899aa] hover:text-[#e2e6ed]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isVarSelected ? 'bg-[#7eb3db]' : 'bg-[#4a5568]'}`}></span>
                                  <span className="break-words whitespace-normal leading-snug">{v.color}</span>
                                </div>

                                <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ${
                                  compCount > 0 
                                    ? 'bg-[#162a20] text-[#8ab896] border border-[#2a4030]' 
                                    : 'bg-[#1a1a1a] text-[#5a6270]'
                                }`}>
                                  {compCount > 0 ? `${compCount} Bahan` : 'Kosong'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory Box */}
            <div className="glass-card rounded-2xl p-4 border-[#1e2330] text-xs text-[#8899aa] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Info className="w-4 h-4 text-[#7eb3db]" />
                <span>Resep Per Varian Warna:</span>
              </div>
              <p className="leading-relaxed text-[0.7rem]">
                Setiap varian warna bisa memiliki aksesoris yang berbeda (contoh: <strong>Kemeja Putih</strong> pakai <em>Kancing Putih</em>, <strong>Kemeja Hitam</strong> pakai <em>Kancing Hitam</em>).
              </p>
              <p className="leading-relaxed text-[0.7rem] text-[#5a6270]">
                Gunakan tombol <strong>"Salin Resep"</strong> untuk menduplikasi susunan aksesoris dari varian lain agar pengisian jauh lebih cepat.
              </p>
            </div>
          </div>

          {/* Right Column: Multi-Item BOM Editor for Selected Variant */}
          <div className="lg:col-span-8 space-y-4">
            {activeArticle && activeVariant ? (
              <div className="glass-card rounded-2xl p-5 md:p-6 border-[#1e2330] space-y-5">
                {/* Header of Active Variant */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2330]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#1a2838] border border-[#2a3848] text-[#7eb3db] flex items-center justify-center font-bold shrink-0">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[#e2e6ed] tracking-tight break-words">{activeArticle.name}</h3>
                        <span className="px-2 py-0.5 rounded-lg bg-[#3d5a80] text-white text-[0.7rem] font-bold break-words">
                          Warna: {activeVariant.color}
                        </span>
                      </div>
                      <p className="text-xs text-[#5a6270] mt-0.5 break-words">Daftar aksesoris & bahan baku yang terpakai saat menjahit varian warna ini</p>
                    </div>
                  </div>

                  {/* Copy Preset from Another Variant */}
                  {allVariantsWithRecipes.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl px-2 py-1 text-xs">
                      <Copy className="w-3.5 h-3.5 text-[#7eb3db] shrink-0" />
                      <select
                        value={copySourceVariantId}
                        onChange={e => setCopySourceVariantId(e.target.value ? Number(e.target.value) : '')}
                        className="bg-transparent border-none text-[0.7rem] text-[#8899aa] focus:outline-none cursor-pointer"
                      >
                        <option value="">Salin dari Varian Warna Lain...</option>
                        {allVariantsWithRecipes.map(item => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </select>
                      {copySourceVariantId && (
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
                                Belum ada komponen bahan dalam resep warna ini. Klik tombol <strong>+ Tambah Komponen Bahan</strong> di bawah.
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
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#121620] hover:bg-[#1a2030] border border-[#2a3040] text-[#7eb3db] hover:text-[#9bc7eb] rounded-xl text-xs font-bold transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Komponen Bahan Lain</span>
                      </button>

                      {activeVariants.length > 1 && editorRows.length > 0 && (
                        <button
                          type="button"
                          onClick={handleApplyToAllVariants}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#8ab896] rounded-xl text-xs font-semibold transition-all"
                          title="Terapkan susunan bahan ini ke semua warna artikel"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Terapkan ke Semua Warna ({activeVariants.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Summary Preview Box */}
                    {editorRows.length > 0 && (
                      <div className="p-4 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[#8ab896] font-bold">
                          <PackageCheck className="w-4 h-4" />
                          <span>Ringkasan Konsumsi 1 pcs [{activeArticle.name} - {activeVariant.color}]:</span>
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
                        onClick={handleSaveVariant}
                        disabled={isSaving}
                        className="w-full py-3 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                      >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        <span>{isSaving ? 'Menyimpan Resep...' : `Simpan Resep untuk ${activeArticle.name} (${activeVariant.color})`}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center glass-card rounded-2xl border-[#1e2330] text-xs text-[#5a6270]">
                Pilih varian warna di sebelah kiri untuk mengatur resep BOM-nya.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Resep Varian Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
