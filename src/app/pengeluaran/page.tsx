'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Pagination from "@/components/ui/Pagination";
import MobileStickyFooter from "@/components/ui/MobileStickyFooter";
import DateFilterGroup from "@/components/ui/DateFilterGroup";
import BaseModal from "@/components/ui/BaseModal";
import KpiStatCard from "@/components/ui/KpiStatCard";
import SearchInput from "@/components/ui/SearchInput";
import QuickSuccessAlert from "@/components/ui/QuickSuccessAlert";
import { usePagination } from "@/hooks/usePagination";
import { formatRupiah, formatCompactRupiah } from "@/lib/utils/formatters";
import { getTodayDateString, filterByDateRange, DateFilterOption } from "@/lib/utils/date";
import { getDbExpenses, createDbExpense, updateDbExpense, deleteDbExpense } from "@/lib/services/db";
import { 
  Receipt, 
  Clock, 
  Plus, 
  Trash2, 
  Pencil, 
  DollarSign,
  Search,
  Tag,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';

interface ExpenseRecord {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  notes?: string;
}

const categories = [
  'Ads (Iklan)', 
  'Bagi Hasil / Konsinyasi',
  'Gaji & Upah Karyawan', 
  'Konsumsi & Operasional',
  'Listrik & Air Pabrik', 
  'Maintenance Mesin Jahit',
  'Ongkir & Ekspedisi', 
  'Packaging & Plastik', 
  'Sewa Tempat / Ruko',
  'Lainnya'
];

export default function PengeluaranPage() {
  const [category, setCategory] = useState('Ads (Iklan)');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(getTodayDateString());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Expense States
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editExpenseDate, setEditExpenseDate] = useState<string>(getTodayDateString());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

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

  const handleSubmit = async (continueEntry: boolean = false) => {
    if (!category || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbExpense({
        category,
        amount,
        expense_date: expenseDate,
        notes: notes.trim() || undefined,
      });

      const lines = [
        `Tanggal: ${expenseDate}`,
        `Kategori: ${category}`,
        `Jumlah Biaya: ${formatRupiah(amount)}`,
        notes ? `Keterangan: ${notes}` : 'Tanpa catatan',
        `Otomatis tercatat sebagai pengurang laba di laporan laba rugi.`,
      ];

      if (continueEntry) {
        setQuickSuccessMsg(`Pengeluaran dicatat: ${category} senilai ${formatRupiah(amount)}`);
        setTimeout(() => setQuickSuccessMsg(null), 4000);
      } else {
        setModalLines(lines);
        setShowModal(true);
      }

      setAmount(0);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Gagal mencatat pengeluaran:', err);
      alert('Gagal mencatat pengeluaran.');
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
    } catch (err) {
      console.error('Gagal menghapus pengeluaran:', err);
      alert('Gagal menghapus catatan pengeluaran.');
    }
  };

  const openEditExpense = (e: ExpenseRecord) => {
    setEditingExpense(e);
    setEditCategory(e.category);
    setEditAmount(e.amount);
    setEditNotes(e.notes || '');
    setEditExpenseDate(e.expense_date);
  };

  const handleSaveEditExpense = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingExpense || editAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await updateDbExpense(editingExpense.id, {
        category: editCategory,
        amount: editAmount,
        expense_date: editExpenseDate,
        notes: editNotes.trim() || undefined,
      });

      setEditingExpense(null);
      await loadData();
    } catch (err) {
      console.error('Gagal update pengeluaran:', err);
      alert('Gagal memperbarui catatan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const totalAllNominal = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const categoryBreakdown = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const biggestCategory = sortedCategories[0];

  // Filtering Logic
  const filteredExpenses = useMemo(() => {
    let result = filterByDateRange(expenses, 'expense_date', dateFilter, customStartDate, customEndDate);
    if (categoryFilter !== 'ALL') {
      result = result.filter(e => e.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.category.toLowerCase().includes(q) || 
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return result;
  }, [expenses, dateFilter, customStartDate, customEndDate, categoryFilter, searchQuery]);

  const totalFilteredNominal = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Pagination Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: pagedExpenses,
  } = usePagination(filteredExpenses, { initialPageSize: 10 });

  return (
    <div>
      <PageHeader 
        title="Catat Beban Operasional" 
        description="Input biaya umum di luar kain & ongkos jahit seperti iklan, ongkir, gaji, listrik, dan packaging" 
      />

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiStatCard
          title="Total Beban Operasional"
          value={<span className="text-[#c87070]">{formatCompactRupiah(totalAllNominal)}</span>}
          icon={Receipt}
          iconColor="text-[#c87070]"
          iconBg="bg-[#241a1a]"
          iconBorder="border-[#3a2828]"
        />
        <KpiStatCard
          title="Total Transaksi Biaya"
          value={<span className="text-[#7eb3db]">{expenses.length} <span className="text-xs font-normal text-[#5a6270]">Kuitansi</span></span>}
          icon={FileSpreadsheet}
          iconColor="text-[#7eb3db]"
        />
        <KpiStatCard
          title="Kategori Terbesar"
          value={<span className="text-sm sm:text-base font-bold text-[#e2e6ed] truncate">{biggestCategory ? biggestCategory[0] : '-'}</span>}
          subtitle={biggestCategory ? formatCompactRupiah(biggestCategory[1]) : undefined}
          icon={TrendingDown}
          iconColor="text-[#c8a870]"
          iconBg="bg-[#201e1a]"
          iconBorder="border-[#3a3020]"
        />
        <KpiStatCard
          title="Rata-rata per Biaya"
          value={<span className="text-[#8ab896]">{formatCompactRupiah(expenses.length > 0 ? Math.round(totalAllNominal / expenses.length) : 0)}</span>}
          icon={DollarSign}
          iconColor="text-[#8ab896]"
          iconBg="bg-[#1a2a20]"
          iconBorder="border-[#2a3a30]"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Input Beban */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] text-[#c87070] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Form Pengeluaran Operasional</h2>
              <p className="text-[0.7rem] text-[#5a6270]">Mempengaruhi laba bersih bulanan pada laporan keuangan</p>
            </div>
          </div>

          <QuickSuccessAlert
            message={quickSuccessMsg}
            onClose={() => setQuickSuccessMsg(null)}
            icon={Receipt}
          />

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                Pilih Kategori Beban <span className="text-[#c87070]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1a2838] border-[#3d5a80] text-[#7eb3db] shadow-sm'
                          : 'bg-[#0c0f17] border-[#1e2330] text-[#8899aa] hover:border-[#2a3848] hover:text-[#e2e6ed]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{cat}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#7eb3db] shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                  Tanggal Pengeluaran <span className="text-[#c87070]">*</span>
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                  Nominal Biaya (Rp) <span className="text-[#c87070]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#5a6270]">Rp</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 pl-9 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-sm font-bold font-mono text-[#c87070] outline-none focus:border-[#7eb3db]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8899aa] uppercase tracking-wider mb-2">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Iklan Meta CP 30k, Beli 5 pack polymailer ukuran 30x40, dsb..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs text-[#e2e6ed] outline-none focus:border-[#7eb3db] resize-none placeholder-[#4a5568]"
              />
            </div>

            {/* Tombol Aksi Simpan */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting || !category || amount <= 0}
                onClick={() => handleSubmit(false)}
                className="w-full sm:flex-1 py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Lihat Rincian'}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting || !category || amount <= 0}
                onClick={() => handleSubmit(true)}
                className="w-full sm:w-auto px-5 py-3 bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] border border-[#2a3040] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>Simpan & Input Lagi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel Riwayat Pengeluaran */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-[#1e2330] flex flex-col justify-between">
          <div className="space-y-3 mb-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2330]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7eb3db]" />
                <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Pengeluaran</h3>
              </div>
              <span className="text-[0.7rem] text-[#8899aa] font-medium">{filteredExpenses.length} Kuitansi</span>
            </div>

            {/* Total Filtered Stat Banner */}
            <div className="p-2.5 bg-[#121620] border border-[#1e2838] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#5a6270]">Total Biaya Terfilter:</span>
              <span className="font-extrabold text-[#c87070] font-mono">{formatRupiah(totalFilteredNominal)}</span>
            </div>

            {/* Search Bar via SearchInput */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari kategori atau catatan..."
            />

            {/* Category Filter Dropdown */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] outline-none font-medium cursor-pointer"
              >
                <option value="ALL">Semua Kategori Beban</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Reusable Universal Date Filter Group */}
            <DateFilterGroup
              value={dateFilter}
              onChange={setDateFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartChange={setCustomStartDate}
              onCustomEndChange={setCustomEndDate}
            />
          </div>

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada catatan pengeluaran operasional sesuai filter.
              </div>
            ) : (
              pagedExpenses.map(e => (
                <div key={e.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-1 text-xs">
                    <span className="font-bold text-[#e2e6ed] break-words leading-snug flex-1 min-w-[140px]">{e.category}</span>
                    <span className="font-mono text-[#5a6270] text-[0.7rem] shrink-0">{e.expense_date}</span>
                  </div>

                  <div className="flex items-center justify-between text-[0.7rem] gap-2">
                    <span className="text-[#8899aa] break-words whitespace-normal leading-snug flex-1">{e.notes || 'Tanpa catatan'}</span>
                    <span className="font-bold text-[#c87070] font-mono shrink-0">{formatRupiah(e.amount)}</span>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openEditExpense(e)}
                      className="text-[#7eb3db] hover:text-[#9ac4e6] font-semibold text-[0.65rem] px-2 py-0.5 rounded hover:bg-[#1a2838] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(e)}
                      className="text-[#c87070] hover:text-[#e07070] font-semibold text-[0.65rem] px-2 py-0.5 rounded hover:bg-[#241a1a] transition-all cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredExpenses.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Edit Expense Modal via BaseModal */}
      <BaseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title={editingExpense ? `Edit Catatan Biaya #${editingExpense.id}` : ''}
        icon={Pencil}
      >
        <form className="space-y-3 text-xs" onSubmit={handleSaveEditExpense}>
          <div>
            <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
              Kategori Pengeluaran <span className="text-[#c87070]">*</span>
            </label>
            <select
              required
              value={editCategory}
              onChange={e => setEditCategory(e.target.value)}
              className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
              Tanggal Pengeluaran <span className="text-[#c87070]">*</span>
            </label>
            <input
              type="date"
              required
              value={editExpenseDate}
              onChange={e => setEditExpenseDate(e.target.value)}
              className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db]"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
              Jumlah Biaya (Rp) <span className="text-[#c87070]">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={editAmount || ''}
              onChange={e => setEditAmount(Number(e.target.value))}
              className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl font-mono text-[#c87070] font-bold outline-none focus:border-[#7eb3db]"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Keterangan detail biaya..."
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              className="w-full p-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] outline-none focus:border-[#7eb3db] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingExpense(null)}
              className="px-3.5 py-2 bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || editAmount <= 0}
              className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Reusable Mobile Sticky Footer */}
      <MobileStickyFooter
        show={amount > 0}
        title={category}
        subTitle={notes}
        primaryValue={formatRupiah(amount)}
        valueColor="text-[#c87070]"
        isSubmitting={isSubmitting}
        disabled={isSubmitting || amount <= 0}
        onSubmit={() => handleSubmit(false)}
      />

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
