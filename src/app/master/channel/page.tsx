'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDbChannels, createDbChannel, deleteDbChannel } from "@/lib/services/db";
import { Store, Plus, Trash2, Search, ShoppingBag } from 'lucide-react';

interface ChannelItem {
  id: number;
  name: string;
}

const PRESET_CHANNELS = [
  'Shopee Official', 'TikTok Shop', 'Tokopedia', 'WhatsApp / CS Direct', 'Offline Butik / Store', 'Bazar & Exhibition', 'Reseller / Agen'
];

export default function ChannelPage() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingChannel, setDeletingChannel] = useState<ChannelItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDbChannels();
      setChannels(res || []);
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newCh = await createDbChannel(name.trim());
      setModalLines([
        `Channel Penjualan: ${newCh.name}`,
        `ID Channel: #${newCh.id}`,
        `Channel ini sekarang akan muncul di form pencatatan penjualan.`,
      ]);
      setShowModal(true);
      setName('');
      await loadData();
    } catch (err: any) {
      alert('Gagal menambah channel: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingChannel) return;
    try {
      await deleteDbChannel(deletingChannel.id);
      setDeletingChannel(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus channel: ' + err.message);
    }
  };

  const filteredChannels = channels.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
          <div className="h-72 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Channel Penjualan" 
        description="Daftar marketplace dan saluran distribusi tempat penjualan produk dicatat" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Header Bar with Search */}
          <div className="glass-card rounded-2xl p-3 border-[#1e2330] flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari channel penjualan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-1 bg-transparent text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:outline-none"
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
            <span className="text-xs text-[#8899aa] font-semibold shrink-0 pr-2">
              Total {channels.length} Channel
            </span>
          </div>

          {filteredChannels.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-2xl border-[#1e2330]">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Store className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">
                {searchQuery ? 'Tidak ada channel yang cocok' : 'Belum ada channel penjualan'}
              </p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan tambahkan channel toko Anda (Shopee, TikTok Shop, WhatsApp, dsb) di samping kanan.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredChannels.map(ch => (
                <div key={ch.id} className="glass-card rounded-2xl p-4 flex items-center justify-between border-[#1e2330] hover:border-[#2a3848] transition-all gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#121822] border border-[#233548] text-[#7eb3db] flex items-center justify-center font-bold text-sm shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[#e2e6ed] text-sm block break-words whitespace-normal leading-snug">{ch.name}</span>
                      <p className="text-[0.7rem] font-mono text-[#5a6270]">ID Channel: #{ch.id}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setDeletingChannel(ch)}
                    className="p-2 text-[#5a6270] hover:text-[#c87070] hover:bg-[#241a1a] rounded-xl transition-colors border border-transparent hover:border-[#3a2020]"
                    title="Hapus Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Channel Form */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7eb3db] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Channel</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Marketplace / Web / Offline Store</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nama Channel <span className="text-[#c87070]">*</span>
              </label>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1 mb-2">
                {PRESET_CHANNELS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setName(p)}
                    className="px-2 py-0.5 rounded-lg text-[0.65rem] font-medium bg-[#0c0f17] text-[#5a6270] border border-[#1e2330] hover:text-[#8899aa] transition-all"
                  >
                    + {p}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                required 
                placeholder="Contoh: Tokopedia, Shopee, Bazar Mall"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#7eb3db] outline-none font-medium placeholder-[#3a4454]"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Channel'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingChannel)}
        title="Hapus Channel Penjualan"
        message={`Apakah Anda yakin ingin menghapus "${deletingChannel?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingChannel(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Channel Berhasil Didaftarkan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
