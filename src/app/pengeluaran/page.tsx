'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  Receipt, 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  CalendarDays, 
  Calendar, 
  X 
} from 'lucide-react';

interface ExpenseRecord {
  id: number;
  category: string;
  amount: number;
  date: string;
  notes: string;
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

const dummyCategories = ['Ads (Iklan)', 'Ongkir Kain', 'Gaji Karyawan', 'Listrik & Air', 'Lainnya'];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const dummyHistory: ExpenseRecord[] = [
  { id: 1, category: 'Ads (Iklan)', amount: 500000, date: getTodayDateString(), notes: 'Shopee Ads Agustus W3' },
  { id: 2, category: 'Gaji Karyawan', amount: 3000000, date: '2026-08-24', notes: 'Gaji penjahit - Agustus' },
  { id: 3, category: 'Ongkir Kain', amount: 150000, date: '2026-08-20', notes: 'Ongkir kain dari Bandung' },
  { id: 4, category: 'Listrik & Air', amount: 450000, date: '2026-08-10', notes: 'Tagihan PLN Workshop' },
];

export default function PengeluaranPage() {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<ExpenseRecord[]>(dummyHistory);

  // Filters (Default: TODAY)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & CRUD State
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);

  // Create Expense
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0) return;

    const newExp: ExpenseRecord = {
      id: history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1,
      category,
      amount,
      date: getTodayDateString(),
      notes: notes.trim(),
    };

    setHistory([newExp, ...history]);

    setModalLines([
      `Kategori: ${category}`,
      `Jumlah Biaya: Rp ${amount.toLocaleString('id-ID')}`,
      notes ? `Keterangan: ${notes}` : 'Tanpa catatan',
      `Otomatis tercatat sebagai pengurang laba bersih di laporan P&L.`,
    ]);
    setShowModal(true);

    setCategory('');
    setAmount(0);
    setNotes('');
  };

  // Update Expense
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setHistory(prev => prev.map(item => item.id === editingExpense.id ? editingExpense : item));
    setEditingExpense(null);
  };

  // Delete Expense
  const handleConfirmDelete = () => {
    if (!deletingExpense) return;
    setHistory(prev => prev.filter(item => item.id !== deletingExpense.id));
    setDeletingExpense(null);
  };

  // Date Filtering Logic
  const matchesDateFilter = (dateStr: string) => {
    const todayStr = getTodayDateString();
    
    if (dateFilter === 'TODAY') return dateStr === todayStr;
    
    if (dateFilter === '7_DAYS') {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      return dateStr >= sevenDaysAgoStr && dateStr <= todayStr;
    }
    
    if (dateFilter === '30_DAYS') {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      return dateStr >= thirtyDaysAgoStr && dateStr <= todayStr;
    }
    
    if (dateFilter === 'CUSTOM') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }
    
    return true;
  };

  const filteredHistory = history.filter(h => matchesDateFilter(h.date));
  const totalFilteredExpense = filteredHistory.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div>
      <PageHeader 
        title="Pengeluaran Operasional" 
        description="Pencatatan biaya non-produk (biaya iklan, ongkir logistik, gaji staf, listrik - mendukung edit & hapus)" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#b85c5c]" />
            <h2 className="text-sm font-bold text-[#e2e6ed] uppercase tracking-wider">Tambah Pengeluaran Baru</h2>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1.5">Kategori Biaya *</label>
              <select
                className="w-full p-3.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm focus:border-[#8c4040] outline-none font-medium appearance-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>-- Pilih Kategori Pengeluaran --</option>
                {dummyCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1.5 text-center">Jumlah Biaya (Rp) *</label>
              <input
                type="number"
                required
                min={1000}
                placeholder="0"
                className="w-full p-3.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#8c4040] outline-none"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8899aa] mb-1.5">Keterangan / Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="Cth: Shopee Ads W3 & TikTok Ads campaign"
                className="w-full p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#8c4040] outline-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 text-sm sm:text-base font-bold bg-[#8c4040] hover:bg-[#a04848] text-white rounded-xl transition-all shadow-sm active:scale-[0.99]"
            >
              Simpan Pengeluaran
            </button>
          </form>
        </div>

        {/* Right Column: Riwayat Pengeluaran with Filter, Edit & Delete */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
          {/* Header Panel */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b85c5c]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pengeluaran</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">
                {filteredHistory.length} dari {history.length} Catatan
              </span>
            </div>

            {/* Total Widget */}
            <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Biaya Operasional:</span>
              <span className="font-extrabold text-[#e2e6ed] font-mono text-xs sm:text-sm">
                Rp {totalFilteredExpense.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Date Filters (Default: Hari Ini) */}
            <div className="space-y-2 pt-1 border-t border-[#1e2330]">
              <div className="flex items-center justify-between text-[0.65rem] font-bold text-[#5a6270] uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#8899aa]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#7a8a9a]" />
                  <span>Filter Tanggal</span>
                </span>
                {dateFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('ALL');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-[#6b8aaf] hover:text-[#8899aa] flex items-center gap-0.5 normal-case font-medium"
                  >
                    <X className="w-3 h-3" /> Reset (Semua)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1">
                {(['TODAY', '7_DAYS', '30_DAYS', 'ALL'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDateFilter(filter)}
                    className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                      dateFilter === filter
                        ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                        : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                    }`}
                  >
                    {filter === 'TODAY' ? 'Hari Ini' : filter === '7_DAYS' ? '7 Hari' : filter === '30_DAYS' ? '1 Bulan' : 'Semua'}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Toggle */}
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'CUSTOM' ? 'TODAY' : 'CUSTOM')}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[0.65rem] font-bold flex items-center justify-between transition-all border ${
                  dateFilter === 'CUSTOM'
                    ? 'bg-[#1a2838] text-[#aab8c8] border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#8899aa] border border-[#1e2330]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#7a8a9a]" />
                  <span>Pilih Rentang Waktu Kustom</span>
                </span>
                <span className="text-[0.6rem] opacity-70">
                  {dateFilter === 'CUSTOM' ? 'Aktif' : 'Atur Tanggal \u2192'}
                </span>
              </button>

              {dateFilter === 'CUSTOM' && (
                <div className="p-2.5 bg-[#0c0f17] border border-[#2a3848] rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[0.6rem] font-semibold text-[#5a6270] mb-0.5">Dari Tanggal</label>
                      <input 
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full p-1.5 bg-[#12161f] border border-[#2a3040] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.6rem] font-semibold text-[#5a6270] mb-0.5">Sampai Tanggal</label>
                      <input 
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full p-1.5 bg-[#12161f] border border-[#2a3040] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List of Expenses */}
          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[480px]">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270] space-y-1">
                <p className="font-semibold text-[#8899aa]">Tidak ada data pengeluaran untuk filter ini.</p>
                <p className="text-[0.7rem] text-[#5a6270]">
                  {dateFilter === 'TODAY' ? 'Belum ada pengeluaran hari ini. Coba pilih filter "7 Hari" atau "Semua".' : 'Coba ubah filter tanggal di atas.'}
                </p>
              </div>
            ) : (
              filteredHistory.map(item => (
                <div key={item.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#b85c5c] text-xs">{item.category}</span>
                    <span className="font-mono text-[#5a6270] text-[0.7rem]">#{item.id} • {item.date}</span>
                  </div>

                  <p className="text-sm font-extrabold text-[#e2e6ed] font-mono">
                    Rp {item.amount.toLocaleString('id-ID')}
                  </p>

                  {item.notes && <p className="text-[0.7rem] text-[#5a6270]">{item.notes}</p>}

                  {/* Actions: Edit & Delete */}
                  <div className="pt-2 border-t border-[#1e2330] flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(item)}
                      className="p-1.5 px-2 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] text-[0.65rem] font-semibold flex items-center gap-1 transition-colors"
                      title="Edit Pengeluaran"
                    >
                      <Pencil className="w-3 h-3 text-[#7a8a9a]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(item)}
                      className="p-1.5 px-2 rounded-lg bg-[#2a1a1a] hover:bg-[#3a2222] text-[#b85c5c] border border-[#3a2828] text-[0.65rem] font-semibold flex items-center gap-1 transition-colors"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7a8a9a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Pengeluaran #{editingExpense.id}</h3>
              </div>
              <button 
                onClick={() => setEditingExpense(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kategori Biaya</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                  >
                    {dummyCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Jumlah Biaya (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={editingExpense.notes}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#3d5a80] hover:bg-[#4a6d8c] text-white transition-all shadow-sm active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Catatan Pengeluaran"
          itemName={`#${deletingExpense.id} • ${deletingExpense.category}`}
          details={[
            `Jumlah Biaya: Rp ${deletingExpense.amount.toLocaleString('id-ID')}`,
            `Tanggal: ${deletingExpense.date}`,
            deletingExpense.notes ? `Catatan: ${deletingExpense.notes}` : '',
          ].filter(Boolean)}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingExpense(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Pengeluaran Berhasil Dicatat!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
