'use client';

import { useState, use } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Link from "next/link";
import { Palette, Layers, Plus, ArrowLeft, Pencil, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface VariantItem {
  color: string;
  stock: number;         // Stok Siap Jual (Grade A)
  rejectStock: number;   // Stok Barang Reject (Cacat / Afkir)
  fabric: string;
}

interface ArticleDetail {
  id: number;
  name: string;
  description: string;
  variants: VariantItem[];
  recipe: { material: string; qty: number; unit: string }[];
}

const dummyArticlesData: Record<number, ArticleDetail> = {
  1: {
    id: 1,
    name: 'Kemeja Lengan Panjang',
    description: 'Kemeja kasual pria bahan katun premium',
    variants: [
      { color: 'Putih', stock: 120, rejectStock: 4, fabric: 'Kain Katun Putih' },
      { color: 'Hitam', stock: 95, rejectStock: 2, fabric: 'Kain Katun Hitam' },
      { color: 'Navy', stock: 75, rejectStock: 1, fabric: 'Kain Katun Navy' },
    ],
    recipe: [
      { material: 'Kancing Kemeja Putih', qty: 6, unit: 'pcs' },
      { material: 'Label Woven Brand', qty: 1, unit: 'pcs' },
    ],
  },
  2: {
    id: 2,
    name: 'Celana Chino Pendek',
    description: 'Bahan katun twill dengan karet elastis',
    variants: [
      { color: 'Khaki', stock: 80, rejectStock: 3, fabric: 'Kain Chino Khaki' },
      { color: 'Hitam', stock: 110, rejectStock: 5, fabric: 'Kain Katun Hitam' },
    ],
    recipe: [
      { material: 'Kancing Kemeja Hitam', qty: 1, unit: 'pcs' },
      { material: 'Resleting YKK 20cm', qty: 1, unit: 'pcs' },
      { material: 'Label Woven Brand', qty: 1, unit: 'pcs' },
      { material: 'Karet Pinggang 3cm', qty: 0.8, unit: 'meter' },
    ],
  },
  3: {
    id: 3,
    name: 'Kaos Polos Oversize',
    description: 'Cotton Combed 24s gramasi tebal',
    variants: [
      { color: 'Putih', stock: 200, rejectStock: 6, fabric: 'Kain Katun Putih' },
      { color: 'Hitam', stock: 180, rejectStock: 4, fabric: 'Kain Katun Hitam' },
      { color: 'Abu-abu', stock: 140, rejectStock: 3, fabric: 'Kain Baby Terry Abu-abu' },
    ],
    recipe: [
      { material: 'Label Woven Brand', qty: 1, unit: 'pcs' },
    ],
  },
};

const availableFabrics = ['Kain Katun Putih', 'Kain Katun Hitam', 'Kain Katun Navy', 'Kain Denim Biru', 'Kain Chino Khaki', 'Kain Baby Terry Abu-abu', 'Kain Parasut Hitam'];

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const articleId = Number(resolvedParams.id);
  
  const article = dummyArticlesData[articleId] || {
    id: articleId,
    name: `Artikel #${articleId}`,
    description: 'Detail artikel',
    variants: [{ color: 'Standard', stock: 50, rejectStock: 0, fabric: 'Kain Standar' }],
    recipe: [{ material: 'Label Woven Brand', qty: 1, unit: 'pcs' }],
  };

  const [variants, setVariants] = useState<VariantItem[]>(article.variants);
  const [newColor, setNewColor] = useState('');
  const [newFabric, setNewFabric] = useState('Kain Katun Putih');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [initialRejectStock, setInitialRejectStock] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingVariant, setEditingVariant] = useState<{ index: number; data: VariantItem } | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<{ index: number; data: VariantItem } | null>(null);

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColor.trim()) return;

    const newV: VariantItem = { 
      color: newColor.trim(), 
      stock: initialStock, 
      rejectStock: initialRejectStock, 
      fabric: newFabric 
    };
    setVariants([...variants, newV]);
    setModalLines([
      `Artikel: ${article.name}`,
      `Varian Baru: ${newColor}`,
      `Kain Terhubung: ${newFabric}`,
      `Stok Siap Jual: ${initialStock} pcs`,
      `Stok Reject: ${initialRejectStock} pcs`,
    ]);
    setShowModal(true);
    setNewColor('');
    setInitialStock(0);
    setInitialRejectStock(0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant || !editingVariant.data.color.trim()) return;

    setVariants(prev => prev.map((v, i) => i === editingVariant.index ? editingVariant.data : v));
    setEditingVariant(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingVariant) return;
    setVariants(prev => prev.filter((_, i) => i !== deletingVariant.index));
    setDeletingVariant(null);
  };

  const totalGoodStock = variants.reduce((a, b) => a + b.stock, 0);
  const totalRejectStock = variants.reduce((a, b) => a + (b.rejectStock || 0), 0);

  return (
    <div>
      <PageHeader 
        title={article.name} 
        description={`${article.description} (Kelola varian warna SKU, pantau stok siap jual & stok reject terpisah)`}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">Warna Varian</th>
                    <th className="p-3.5">Kain Terhubung</th>
                    <th className="p-3.5">Stok Siap Jual</th>
                    <th className="p-3.5">Stok Reject</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {variants.map((v, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-bold text-white">{v.color}</td>
                      <td className="p-3.5 text-[#8899aa] text-xs">{v.fabric}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-[#8ab896] bg-[#1a2a20] px-2.5 py-1 rounded-lg border border-[#2a3a30]">
                          <CheckCircle2 className="w-3 h-3" />
                          {v.stock} pcs
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-[#c8a870] bg-[#201e1a] px-2.5 py-1 rounded-lg border border-[#3a3020]">
                          <AlertTriangle className="w-3 h-3 text-[#b89860]" />
                          {v.rejectStock || 0} pcs
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingVariant({ index: i, data: { ...v } })}
                            className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                            title="Edit Varian"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#7a8a9a]" />
                          </button>
                          <button
                            onClick={() => setDeletingVariant({ index: i, data: v })}
                            className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
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
          </div>

          {/* Recipe / BOM */}
          <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-slate-300" />
              <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Resep Bahan Rasio-Tetap (Per 1 Pcs)</h2>
            </div>
            <div className="divide-y divide-[#1e2330] text-xs sm:text-sm">
              {article.recipe.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <span className="text-[#8899aa] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    <span>{r.material}</span>
                  </span>
                  <span className="font-bold text-[#e2e6ed] bg-[#0c0f17] px-3 py-1 rounded-lg border border-[#2a3040]">{r.qty} {r.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Add New Variant Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#7a8a9a]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Varian Warna</h2>
          </div>
          <form className="space-y-4" onSubmit={handleAddVariant}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Warna (SKU) *</label>
              <input
                type="text"
                required
                placeholder="Cth: Maroon, Sage Green"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kain yang Digunakan</label>
              <select
                value={newFabric}
                onChange={(e) => setNewFabric(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
              >
                {availableFabrics.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8ab896] mb-1">Stok Siap Jual</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={initialStock || ''}
                  onChange={(e) => setInitialStock(Number(e.target.value))}
                  className="w-full p-3 bg-[#0c0f17] border border-[#2a3a30] rounded-xl text-[#8ab896] text-xs sm:text-sm focus:border-[#6ea87a] outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c8a870] mb-1">Stok Reject</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={initialRejectStock || ''}
                  onChange={(e) => setInitialRejectStock(Number(e.target.value))}
                  className="w-full p-3 bg-[#0c0f17] border border-[#3a3020] rounded-xl text-[#c8a870] text-xs sm:text-sm focus:border-[#b89860] outline-none font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              Simpan Varian Baru
            </button>
          </form>
        </div>
      </div>

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Varian Warna SKU</h3>
              </div>
              <button 
                onClick={() => setEditingVariant(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Warna (SKU)</label>
                <input
                  type="text"
                  required
                  value={editingVariant.data.color}
                  onChange={(e) => setEditingVariant({
                    ...editingVariant,
                    data: { ...editingVariant.data, color: e.target.value }
                  })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kain Terhubung</label>
                <select
                  value={editingVariant.data.fabric}
                  onChange={(e) => setEditingVariant({
                    ...editingVariant,
                    data: { ...editingVariant.data, fabric: e.target.value }
                  })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                >
                  {availableFabrics.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8ab896] mb-1">Stok Siap Jual (Pcs)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingVariant.data.stock}
                    onChange={(e) => setEditingVariant({
                      ...editingVariant,
                      data: { ...editingVariant.data, stock: Number(e.target.value) }
                    })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3a30] rounded-xl text-[#8ab896] text-sm font-bold focus:border-[#6ea87a] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c8a870] mb-1">Stok Reject (Pcs)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingVariant.data.rejectStock || 0}
                    onChange={(e) => setEditingVariant({
                      ...editingVariant,
                      data: { ...editingVariant.data, rejectStock: Number(e.target.value) }
                    })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#3a3020] rounded-xl text-[#c8a870] text-sm font-bold focus:border-[#b89860] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
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
      {deletingVariant && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Varian Warna"
          itemName={`${article.name} - ${deletingVariant.data.color}`}
          details={[
            `Kain Terhubung: ${deletingVariant.data.fabric}`,
            `Stok Siap Jual: ${deletingVariant.data.stock} pcs`,
            `Stok Reject: ${deletingVariant.data.rejectStock || 0} pcs`,
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingVariant(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Varian Baru Ditambahkan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
