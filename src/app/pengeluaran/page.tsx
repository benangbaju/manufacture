'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDbExpenses, createDbExpense, deleteDbExpense } from "@/lib/services/db";
import { 
  Receipt, 
  Clock, 
  Plus, 
  Trash2, 
  CalendarDays, 
  DollarSign
} from 'lucide-react';

interface ExpenseRecord {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  notes?: string;
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

const categories = ['Ads (Iklan)', 'Ongkir Kain', 'Gaji Karyawan', 'Listrik & Air', 'Packaging & Packing', 'Lainnya'];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function PengeluaranPage() {
  const [category, setCategory] = useState('Ads (Iklan)');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(getTodayDateString());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (Default: ALL)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getDbExpenses();
      setExpenses(list || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbExpense({
        category,
        amount,
        expense_date: expenseDate,
        notes: notes.trim() || undefined,
      });

      setModalLines([
        `Tanggal: ${expenseDate}`,
        `Kategori: ${category}`,
        `Jumlah Biaya: Rp ${amount.toLocaleString('id-ID')}`,
        notes ? `Keterangan: ${notes}` : 'Tanpa catatan',
        `Otomatis tercatat sebagai pengurang laba di laporan laba rugi.`,
      ]);
      setShowModal(true);

      setAmount(0);
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert('Gagal mencatat pengeluaran: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      await deleteDbExpense(deletingExpense.id);
      setDeletingExpense(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus catatan pengeluaran: ' + err.message);
    }
  };

  // Date Filtering Logic
  const todayStr = getTodayDateString();
  const filteredExpenses = expenses.filter(e => {
    if (dateFilter === 'TODAY') return e.expense_date === todayStr;
    if (dateFilter === '7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(e.expense_date) >= sevenDaysAgo;
    }
    if (dateFilter === '30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(e.expense_date) >= thirtyDaysAgo;
    }
    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const eDate = new Date(e.expense_date);
      if (customStartDate && eDate < new Date(customStartDate)) return false;
      if (customEndDate && eDate > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  });

  const totalFilteredNominal = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div>
      <PageHeader 
        title="Catat Beban Operasional" 
        description="Input biaya umum di luar kain & ongkos jahit seperti iklan, ongkir, gaji, listrik, dan packaging" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Input Beban */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Kategori Pengeluaran <span className="text-[#c87070]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                  required
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Tanggal Pengeluaran <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Nominal Biaya (Rp) <span className="text-[#c87070]">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-3 text-2xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                Keterangan / Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Iklan TikTok Live batch #12"
                className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none placeholder-[#3a4454]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran Operasional'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Riwayat Pengeluaran */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7a8a9a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pengeluaran</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">{filteredExpenses.length} Biaya</span>
            </div>

            <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Biaya:</span>
              <span className="font-extrabold text-[#c87070] text-sm">Rp {totalFilteredNominal.toLocaleString('id-ID')}</span>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                type="button"
                onClick={() => setDateFilter('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  dateFilter === 'ALL'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('TODAY')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  dateFilter === 'TODAY'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('30_DAYS')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  dateFilter === '30_DAYS'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada catatan pengeluaran operasional.
              </div>
            ) : (
              filteredExpenses.map(e => (
                <div key={e.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#e2e6ed]">{e.category}</span>
                    <span className="font-mono text-[#5a6270] text-[0.7rem]">{e.expense_date}</span>
                  </div>

                  <div className="flex items-center justify-between text-[0.7rem]">
                    <span className="text-[#8899aa]">{e.notes || 'Tanpa catatan'}</span>
                    <span className="font-bold text-[#c87070]">Rp {(e.amount || 0).toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setDeletingExpense(e)}
                      className="text-[0.65rem] text-[#c87070] hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingExpense)}
        title="Hapus Catatan Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus catatan pengeluaran #${deletingExpense?.id} (${deletingExpense?.category})?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingExpense(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Pengeluaran Berhasil Dicatat!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
