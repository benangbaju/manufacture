'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Store, Plus, Pencil, Trash2, X } from 'lucide-react';

interface ChannelItem {
  id: number;
  name: string;
}

const initialChannels: ChannelItem[] = [
  { id: 1, name: 'Shopee' },
  { id: 2, name: 'TikTok Shop' },
  { id: 3, name: 'Website' },
  { id: 4, name: 'Offline Store' },
  { id: 5, name: 'WhatsApp / Chat' },
];

export default function ChannelPage() {
  const [channels, setChannels] = useState<ChannelItem[]>(initialChannels);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<ChannelItem | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = channels.length > 0 ? Math.max(...channels.map(c => c.id)) + 1 : 1;
    const newCh = { id: newId, name: name.trim() };

    setChannels([...channels, newCh]);
    setModalLines([
      `Channel Penjualan: ${name}`,
      `ID Channel: #${newId}`,
      `Channel ini sekarang akan muncul di form pencatatan penjualan.`,
    ]);
    setShowModal(true);
    setName('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel || !editingChannel.name.trim()) return;

    setChannels(prev => prev.map(c => c.id === editingChannel.id ? editingChannel : c));
    setEditingChannel(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingChannel) return;
    setChannels(prev => prev.filter(c => c.id !== deletingChannel.id));
    setDeletingChannel(null);
  };

  return (
    <div>
      <PageHeader 
        title="Channel Penjualan" 
        description="Daftar marketplace dan saluran distribusi tempat penjualan produk dicatat (mendukung edit & hapus)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2.5">
          {channels.map(ch => (
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
                  onClick={() => setEditingChannel(ch)}
                  className="p-2 text-[#5a6270] hover:text-[#7a8a9a] hover:bg-[#1a2030] rounded-xl transition-colors"
                  title="Edit Channel"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingChannel(ch)}
                  className="p-2 text-[#5a6270] hover:text-[#b85c5c] hover:bg-[#2a1a1a] rounded-xl transition-colors"
                  title="Hapus Channel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5 border-[#1e2330] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#7a8a9a]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Channel Baru</h2>
          </div>
          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Channel Baru *</label>
              <input 
                type="text" 
                required 
                placeholder="Cth: Tokopedia, Lazada, Bazar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              Simpan Channel
            </button>
          </form>
        </div>
      </div>

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Channel #{editingChannel.id}</h3>
              </div>
              <button 
                onClick={() => setEditingChannel(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Nama Channel</label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] transition-all shadow-sm active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingChannel && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Channel Penjualan"
          itemName={`#${deletingChannel.id} • ${deletingChannel.name}`}
          details={['Channel ini tidak akan lagi muncul dalam pilihan penjualan baru.']}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingChannel(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Channel Penjualan Ditambahkan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
