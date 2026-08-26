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
import { Link2, Plus, Trash2, Scissors } from 'lucide-react';

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

  return (
    <div>
      <PageHeader 
        title="Pemetaan Kain ke Varian" 
        description="Hubungkan varian warna artikel ke jenis roll kain yang otomatis dipotong saat produksi berlangsung" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border-[#1e2330]">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between text-xs text-[#5a6270]">
            <span className="font-semibold text-[#8899aa]">Total: {mappings.length} Pemetaan Aktif</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#5a6270]">Memuat data pemetaan dari database...</div>
          ) : mappings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Link2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada pemetaan kain ke varian</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan hubungkan varian artikel dengan stok kain yang sesuai pada form di samping.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0e1219] text-[#5a6270] text-[0.7rem] uppercase tracking-wider border-b border-[#1e2330]">
                    <th className="p-3.5">Artikel Produk</th>
                    <th className="p-3.5">Varian Warna</th>
                    <th className="p-3.5">Roll Kain yang Dipotong</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {mappings.map(m => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-bold text-[#e2e6ed]">{m.articles?.name || `#${m.article_id}`}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#1a2030] text-[#8899aa] font-semibold border border-[#2a3040] text-xs">
                          {m.variant_color}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-[#6ea87a] font-medium">
                          <Scissors className="w-3.5 h-3.5 opacity-70" />
                          <span>{m.fabric_stock?.name || `#${m.fabric_stock_id}`}</span>
                        </div>
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

        {/* Form Tambah Pemetaan */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Hubungkan Kain ke Varian</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Otomatisasi pemotongan stok kain</p>
            </div>
          </div>

          {articles.length === 0 || fabrics.length === 0 ? (
            <p className="text-xs text-[#5a6270] p-4 bg-[#0e1219] rounded-xl border border-[#1e2330]">
              Pastikan Anda sudah membuat minimal 1 Artikel dan 1 Stok Kain terlebih dahulu.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleAdd}>
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
                  Nama Warna Varian <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Putih, Navy, Sage Green"
                  value={variantColor}
                  onChange={(e) => setVariantColor(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454]"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Roll Kain yang Digunakan <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={selectedFabricId}
                  onChange={(e) => setSelectedFabricId(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                  required
                >
                  {fabrics.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
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
        message={`Apakah Anda yakin ingin menghapus pemetaan kain untuk ${deletingMap?.articles?.name} - ${deletingMap?.variant_color}?`}
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
