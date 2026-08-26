'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDbChannels, createDbChannel, deleteDbChannel } from "@/lib/services/db";
import { Store, Plus, Trash2 } from 'lucide-react';

interface ChannelItem {
  id: number;
  name: string;
}

export default function ChannelPage() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div>
      <PageHeader 
        title="Channel Penjualan" 
        description="Daftar marketplace dan saluran distribusi tempat penjualan produk dicatat" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2.5">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#5a6270]">Memuat data channel dari database...</div>
          ) : channels.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <Store className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada channel penjualan</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan tambahkan channel toko Anda (Shopee, TikTok Shop, WhatsApp, dsb) di samping kanan.
              </p>
            </div>
          ) : (
            channels.map(ch => (
              <div key={ch.id} className="glass-card rounded-2xl p-4 flex items-center justify-between border-[#1e2330] hover:border-[#2a3848] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1a2030] border border-[#2a3040] text-[#7a8a9a] flex items-center justify-center font-bold text-sm">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#e2e6ed] text-sm sm:text-base">{ch.name}</span>
                    <p className="text-[0.7rem] font-mono text-[#5a6270]">ID: #{ch.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setDeletingChannel(ch)}
                    className="p-2 text-[#5a6270] hover:text-[#b85c5c] hover:bg-[#241a1a] rounded-xl transition-colors"
                    title="Hapus Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Tambah Channel */}
        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#7a8a9a] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tambah Channel Baru</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Marketplace / Web / Offline Store</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nama Channel <span className="text-[#c87070]">*</span>
              </label>
              <input 
                type="text" 
                required 
                placeholder="Contoh: Tokopedia, Lazada, Bazar Mall"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium placeholder-[#3a4454]"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
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
