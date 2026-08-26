'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  Factory, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Check, 
  CheckCircle2, 
  Coins, 
  Calendar,
  CalendarDays,
  X,
  Pencil,
  Trash2,
  Scissors
} from 'lucide-react';

interface ColorVariant {
  color: string;
  fabric: string;
  fabricStock: number;
  finishedStock: number;
  rejectStock: number;
}

interface RecipeItem {
  name: string;
  qty: number;
  unit: string;
  stock: number;
}

interface ArticleItem {
  id: number;
  name: string;
  defaultCostPerPcs: number;
  colors: ColorVariant[];
  recipe: RecipeItem[];
}

interface BatchRecord {
  id: number;
  date: string;
  article: string;
  variant: string;
  qty: number;         // Barang Jadi Bagus (Grade A)
  qtyReject: number;   // Barang Reject (Cacat / Afkir)
  fabricUsed: number;
  yield: number;
  costPerPcs: number;
  paid: boolean;
  paidDate?: string;
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

const dummyArticles: ArticleItem[] = [
  { 
    id: 1, 
    name: 'Kemeja Lengan Panjang', 
    defaultCostPerPcs: 8500,
    colors: [
      { color: 'Putih', fabric: 'Kain Katun Putih', fabricStock: 80, finishedStock: 120, rejectStock: 4 },
      { color: 'Hitam', fabric: 'Kain Katun Hitam', fabricStock: 65, finishedStock: 95, rejectStock: 2 },
      { color: 'Navy', fabric: 'Kain Katun Navy', fabricStock: 40, finishedStock: 75, rejectStock: 1 },
    ],
    recipe: [
      { name: 'Kancing Kemeja Putih', qty: 6, unit: 'pcs', stock: 500 },
      { name: 'Label Woven Brand', qty: 1, unit: 'pcs', stock: 800 },
    ]
  },
  { 
    id: 2, 
    name: 'Celana Chino Pendek', 
    defaultCostPerPcs: 7500,
    colors: [
      { color: 'Khaki', fabric: 'Kain Chino Khaki', fabricStock: 30, finishedStock: 80, rejectStock: 3 },
      { color: 'Hitam', fabric: 'Kain Katun Hitam', fabricStock: 65, finishedStock: 110, rejectStock: 5 },
    ],
    recipe: [
      { name: 'Kancing Kemeja Hitam', qty: 1, unit: 'pcs', stock: 350 },
      { name: 'Resleting YKK 20cm', qty: 1, unit: 'pcs', stock: 200 },
      { name: 'Label Woven Brand', qty: 1, unit: 'pcs', stock: 800 },
    ]
  },
  { 
    id: 3, 
    name: 'Kaos Polos Oversize', 
    defaultCostPerPcs: 5000,
    colors: [
      { color: 'Putih', fabric: 'Kain Katun Putih', fabricStock: 80, finishedStock: 200, rejectStock: 6 },
      { color: 'Hitam', fabric: 'Kain Katun Hitam', fabricStock: 65, finishedStock: 180, rejectStock: 4 },
      { color: 'Abu-abu', fabric: 'Kain Baby Terry Abu-abu', fabricStock: 45, finishedStock: 140, rejectStock: 3 },
    ],
    recipe: [
      { name: 'Label Woven Brand', qty: 1, unit: 'pcs', stock: 800 },
    ]
  },
];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const initialHistory: BatchRecord[] = [
  { id: 105, date: getTodayDateString(), article: 'Kemeja Lengan Panjang', variant: 'Putih', qty: 48, qtyReject: 2, fabricUsed: 1.7, yield: 29.4, costPerPcs: 8500, paid: false },
  { id: 104, date: '2026-08-24', article: 'Celana Chino Pendek', variant: 'Hitam', qty: 57, qtyReject: 3, fabricUsed: 2.0, yield: 30.0, costPerPcs: 7500, paid: false },
  { id: 103, date: '2026-08-22', article: 'Celana Chino Pendek', variant: 'Khaki', qty: 43, qtyReject: 2, fabricUsed: 1.5, yield: 30.0, costPerPcs: 7500, paid: true, paidDate: '2026-08-23' },
  { id: 102, date: '2026-08-15', article: 'Kaos Polos Oversize', variant: 'Hitam', qty: 77, qtyReject: 3, fabricUsed: 2.5, yield: 32.0, costPerPcs: 5000, paid: false },
  { id: 101, date: '2026-08-05', article: 'Kemeja Lengan Panjang', variant: 'Navy', qty: 68, qtyReject: 2, fabricUsed: 2.3, yield: 30.4, costPerPcs: 8500, paid: true, paidDate: '2026-08-07' },
  { id: 100, date: '2026-07-25', article: 'Kaos Polos Oversize', variant: 'Putih', qty: 96, qtyReject: 4, fabricUsed: 3.1, yield: 32.2, costPerPcs: 5000, paid: true, paidDate: '2026-07-27' },
];

export default function ProduksiPage() {
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [qtyReject, setQtyReject] = useState<number>(0);
  const [fabricInputUnit, setFabricInputUnit] = useState<'meter' | 'yard'>('meter');
  const [fabricUsed, setFabricUsed] = useState<number>(0);
  const [costPerPcs, setCostPerPcs] = useState<number>(8000);
  const [isPaidDirectly, setIsPaidDirectly] = useState<boolean>(false);
  const [history, setHistory] = useState<BatchRecord[]>(initialHistory);
  const [showRejectInventoryModal, setShowRejectInventoryModal] = useState(false);
  
  // Filters (Default: TODAY / Hari Ini)
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Modals & Confirmation States
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [pendingPaymentAction, setPendingPaymentAction] = useState<BatchRecord | null>(null);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<BatchRecord | null>(null);

  const activeArticle = dummyArticles.find(a => a.id === selectedArticle);
  const activeColorObj = activeArticle?.colors.find(c => c.color === selectedColor);

  // Total Potongan & Pengerjaan = Qty Bagus + Qty Reject
  const totalCutPieces = (qty || 0) + (qtyReject || 0);

  // 1 yard = 0.9144 meter
  const effectiveFabricUsed = fabricInputUnit === 'yard' ? Number((fabricUsed * 0.9144).toFixed(2)) : fabricUsed;
  const isFabricInsufficient = activeColorObj ? effectiveFabricUsed > activeColorObj.fabricStock : false;
  const currentYield = totalCutPieces > 0 && effectiveFabricUsed > 0 ? (totalCutPieces / effectiveFabricUsed).toFixed(1) : '0.0';
  const totalCost = totalCutPieces * costPerPcs;

  const handleArticleSelect = (id: number) => {
    setSelectedArticle(id);
    setSelectedColor('');
    const art = dummyArticles.find(a => a.id === id);
    if (art) {
      setCostPerPcs(art.defaultCostPerPcs);
    }
  };

  const handleOpenPaymentConfirm = (batch: BatchRecord) => {
    setPendingPaymentAction(batch);
  };

  const handleConfirmPaymentAction = () => {
    if (!pendingPaymentAction) return;
    const batchId = pendingPaymentAction.id;

    setHistory(prev => prev.map(b => {
      if (b.id === batchId) {
        const nextPaid = !b.paid;
        return {
          ...b,
          paid: nextPaid,
          paidDate: nextPaid ? getTodayDateString() : undefined
        };
      }
      return b;
    }));

    setPendingPaymentAction(null);
  };

  // Update (Edit) Batch
  const handleSaveEditBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    const totalEditPieces = (editingBatch.qty || 0) + (editingBatch.qtyReject || 0);
    const recalculatedYield = totalEditPieces > 0 && editingBatch.fabricUsed > 0 
      ? Number((totalEditPieces / editingBatch.fabricUsed).toFixed(1))
      : 0;

    const updated = {
      ...editingBatch,
      yield: recalculatedYield
    };

    setHistory(prev => prev.map(b => b.id === updated.id ? updated : b));
    setEditingBatch(null);
  };

  // Delete Batch
  const handleConfirmDeleteBatch = () => {
    if (!deletingBatch) return;
    setHistory(prev => prev.filter(b => b.id !== deletingBatch.id));
    setDeletingBatch(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !selectedColor || totalCutPieces <= 0 || effectiveFabricUsed <= 0) return;

    const newBatch: BatchRecord = {
      id: history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 100,
      date: getTodayDateString(),
      article: activeArticle.name,
      variant: selectedColor,
      qty,
      qtyReject: qtyReject || 0,
      fabricUsed: effectiveFabricUsed,
      yield: Number(currentYield),
      costPerPcs: costPerPcs || 0,
      paid: isPaidDirectly,
      paidDate: isPaidDirectly ? getTodayDateString() : undefined
    };

    setHistory([newBatch, ...history]);

    const lines = [
      `Produk: ${activeArticle.name} - ${selectedColor}`,
      `Stok Barang Jadi (Grade A) bertambah: +${qty} pcs`,
      qtyReject > 0 ? `Stok Barang Reject bertambah: +${qtyReject} pcs (tercatat di inventori reject)` : `Tidak ada reject (100% Bagus)`,
      `Total Potong & Pengerjaan: ${totalCutPieces} pcs`,
      fabricInputUnit === 'yard'
        ? `Kain (${activeColorObj?.fabric}) berkurang: -${effectiveFabricUsed} meter (Input: ${fabricUsed} yard)`
        : `Kain (${activeColorObj?.fabric}) berkurang: -${effectiveFabricUsed} meter`,
    ];

    activeArticle.recipe.forEach(r => {
      lines.push(`${r.name} berkurang: -${totalCutPieces * r.qty} ${r.unit}`);
    });

    lines.push(`Total Ongkos Jahit: Rp ${(totalCutPieces * costPerPcs).toLocaleString('id-ID')} (${isPaidDirectly ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR'})`);
    lines.push(`Yield Efisiensi Potong: ${currentYield} pcs/meter`);

    setModalLines(lines);
    setShowModal(true);

    setSelectedArticle(null);
    setSelectedColor('');
    setQty(0);
    setQtyReject(0);
    setFabricUsed(0);
    setFabricInputUnit('meter');
    setIsPaidDirectly(false);
  };

  // Date Filtering Logic
  const matchesDateFilter = (batchDateStr: string) => {
    const todayStr = getTodayDateString();
    
    if (dateFilter === 'TODAY') {
      return batchDateStr === todayStr;
    }
    
    if (dateFilter === '7_DAYS') {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      return batchDateStr >= sevenDaysAgoStr && batchDateStr <= todayStr;
    }
    
    if (dateFilter === '30_DAYS') {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      return batchDateStr >= thirtyDaysAgoStr && batchDateStr <= todayStr;
    }
    
    if (dateFilter === 'CUSTOM') {
      if (customStartDate && batchDateStr < customStartDate) return false;
      if (customEndDate && batchDateStr > customEndDate) return false;
      return true;
    }
    
    return true;
  };

  // Filtered list combining Payment and Date filters
  const filteredHistory = history.filter(b => {
    // Payment filter
    if (filterPayment === 'UNPAID' && b.paid) return false;
    if (filterPayment === 'PAID' && !b.paid) return false;

    // Date filter
    if (!matchesDateFilter(b.date)) return false;

    return true;
  });

  const unpaidCount = filteredHistory.filter(b => !b.paid).length;
  const totalUnpaidNominal = filteredHistory
    .filter(b => !b.paid)
    .reduce((acc, curr) => acc + (curr.qty * curr.costPerPcs), 0);

  const totalFilteredGoodQty = filteredHistory.reduce((acc, curr) => acc + curr.qty, 0);
  const totalFilteredRejectQty = filteredHistory.reduce((acc, curr) => acc + (curr.qtyReject || 0), 0);
  const totalFilteredCutPieces = totalFilteredGoodQty + totalFilteredRejectQty;

  // Calculate reject inventory summary from dummyArticles
  const allVariantsRejectList = dummyArticles.flatMap(a => 
    a.colors.map(c => ({
      articleId: a.id,
      articleName: a.name,
      color: c.color,
      fabric: c.fabric,
      finishedStock: c.finishedStock,
      rejectStock: c.rejectStock || 0
    }))
  );
  const totalRejectStockAll = allVariantsRejectList.reduce((acc, curr) => acc + curr.rejectStock, 0);

  return (
    <div>
      <PageHeader 
        title="Catat Hasil Produksi" 
        description="Pilih artikel & warna, catat jumlah barang jadi (Grade A) serta barang reject secara terpisah dengan alokasi biaya transparan"
        action={
          <button
            type="button"
            onClick={() => setShowRejectInventoryModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#201e1a] hover:bg-[#2e261a] border border-[#3a3020] rounded-xl text-xs sm:text-sm text-[#c8a870] font-semibold transition-all shadow-sm group"
          >
            <AlertTriangle className="w-4 h-4 text-[#b89860]" />
            <span>Inventori Reject ({totalRejectStockAll} pcs)</span>
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Step 1: Pilih Artikel */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-[#1a2838] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">1</span>
                <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Artikel Baju</label>
              </div>
              <select
                className="w-full p-3.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm sm:text-base focus:border-[#4a6d8c] outline-none font-medium appearance-none cursor-pointer"
                value={selectedArticle || ''}
                onChange={(e) => handleArticleSelect(Number(e.target.value))}
                required
              >
                <option value="" disabled>-- Pilih dari 21 Artikel --</option>
                {dummyArticles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* Step 2: Pilih Warna Varian */}
            {activeArticle && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#1a2838] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">2</span>
                  <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Warna Varian</label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {activeArticle.colors.map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setSelectedColor(c.color)}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        selectedColor === c.color 
                          ? 'bg-[#201e1a] text-[#c8a870] border-[#3a3020] shadow-sm' 
                          : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{c.color}</p>
                        {selectedColor === c.color && <Check className="w-4 h-4 text-[#b89860]" />}
                      </div>
                      <p className="text-[0.7rem] text-[#5a6270] mt-1">Stok Kain: <span className="font-semibold text-[#b0b8c4]">{c.fabricStock} meter</span></p>
                      <div className="flex items-center justify-between text-[0.65rem] text-[#7a8a9a] mt-1 pt-1 border-t border-[#1e2330]">
                        <span>Bagus: <strong className="text-[#8ab896]">{c.finishedStock}</strong></span>
                        <span>Reject: <strong className="text-[#c8a870]">{c.rejectStock || 0}</strong></span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Input Angka & Auto Calculation */}
            {selectedColor && activeColorObj && activeArticle && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Info Box */}
                <div className="p-4 bg-[#151a24] border border-[#2a3040] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#7a8a9a] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ESTIMASI PENGURANGAN BAHAN (TOTAL {totalCutPieces} PCS POTONG):</span>
                    </span>
                    <span>Stok Kain: {activeColorObj.fabricStock} meter</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#8899aa]">
                    <p>• Kain Dipakai: <span className="font-bold text-[#e2e6ed]">{activeColorObj.fabric}</span></p>
                    {activeArticle.recipe.map(r => (
                      <p key={r.name}>• {r.name}: <span className="font-bold text-[#e2e6ed]">{totalCutPieces > 0 ? totalCutPieces * r.qty : 0} {r.unit}</span></p>
                    ))}
                  </div>
                  <p className="text-[0.65rem] text-[#7a8a9a] italic pt-1 border-t border-[#2a3040]/50">
                    * Catatan: Bahan baku dan ongkos dihitung dari total potongan (Bagus + Reject) karena bahan dan tenaga kerja tetap terpakai penuh.
                  </p>
                </div>

                {isFabricInsufficient && (
                  <div className="p-3.5 bg-[#2a1a1a] border border-[#3a2828] rounded-xl text-[#c87070] text-xs font-semibold flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#b85c5c] shrink-0" />
                    <span>Peringatan: Jumlah kain terpakai ({effectiveFabricUsed} meter) melebihi stok di gudang ({activeColorObj.fabricStock} meter)!</span>
                  </div>
                )}

                {/* Fabric Unit Selector Toggle */}
                <div className="flex items-center justify-between p-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs">
                  <span className="text-[#8899aa] font-semibold">Satuan Input Kain:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFabricInputUnit('meter')}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                        fabricInputUnit === 'meter'
                          ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                          : 'bg-[#12161f] text-[#5a6270] hover:text-[#8899aa]'
                      }`}
                    >
                      Meter (Standar)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFabricInputUnit('yard')}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                        fabricInputUnit === 'yard'
                          ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                          : 'bg-[#12161f] text-[#5a6270] hover:text-[#8899aa]'
                      }`}
                    >
                      Yard (Konversi)
                    </button>
                  </div>
                </div>

                {/* Grid Inputs: Qty Bagus vs Qty Reject & Kain */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-3 bg-[#0e141a] border border-[#1e2a30] rounded-xl">
                    <label className="block text-xs font-bold text-[#8ab896] mb-1.5 text-center">
                      Hasil Bagus (Grade A) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="0"
                      className="w-full p-3 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3a30] rounded-xl text-[#8ab896] focus:border-[#6ea87a] outline-none"
                      value={qty || ''}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                    <p className="text-[0.65rem] text-[#5a6270] text-center mt-1">Masuk Stok Siap Jual</p>
                  </div>

                  <div className="p-3 bg-[#181510] border border-[#30281e] rounded-xl">
                    <label className="block text-xs font-bold text-[#c8a870] mb-1.5 text-center">
                      Hasil Reject (Cacat)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-full p-3 text-2xl font-black text-center bg-[#0c0f17] border border-[#3a3020] rounded-xl text-[#c8a870] focus:border-[#b89860] outline-none"
                      value={qtyReject || ''}
                      onChange={(e) => setQtyReject(Number(e.target.value))}
                    />
                    <p className="text-[0.65rem] text-[#7a8a9a] text-center mt-1">Masuk Inventori Reject</p>
                  </div>

                  <div className="p-3 bg-[#0e1219] border border-[#1e2330] rounded-xl">
                    <label className="block text-xs font-bold text-[#8899aa] mb-1.5 text-center">
                      Kain Terpakai ({fabricInputUnit}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0.01}
                      step={0.01}
                      placeholder="0.0"
                      className="w-full p-3 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                      value={fabricUsed || ''}
                      onChange={(e) => setFabricUsed(Number(e.target.value))}
                    />
                    <p className="text-[0.65rem] text-[#5a6270] text-center mt-1">Pemakaian Batch</p>
                  </div>
                </div>

                {/* Total Output Summary Badge */}
                <div className="p-3 bg-[#0f141d] border border-[#1e2838] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-[#7a8a9a]" />
                    <span className="text-[#8899aa]">Total Dipotong / Dikerjakan:</span>
                    <span className="font-extrabold text-[#e2e6ed] text-sm">{totalCutPieces} pcs</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.7rem]">
                    <span className="px-2 py-0.5 rounded bg-[#1a2a20] text-[#8ab896] font-bold">Grade A: {qty}</span>
                    <span className="px-2 py-0.5 rounded bg-[#201e1a] text-[#c8a870] font-bold">Reject: {qtyReject}</span>
                  </div>
                </div>

                {fabricInputUnit === 'yard' && fabricUsed > 0 && (
                  <div className="p-3 bg-[#151a24] border border-[#2a3848] rounded-xl text-xs text-[#aab8c8] flex items-center justify-between animate-in fade-in duration-150">
                    <span className="flex items-center gap-1.5 text-[#8899aa]">
                      <Scissors className="w-3.5 h-3.5 text-[#7a8a9a]" />
                      <span>Konversi Otomatis ke Meter:</span>
                    </span>
                    <span className="font-bold text-[#6ea87a]">
                      {fabricUsed} yard &rarr; {effectiveFabricUsed} meter
                    </span>
                  </div>
                )}

                {/* Ongkos Jahit & Status Pembayaran */}
                <div className="p-4 bg-[#0e1219] border border-[#1e2330] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#b0b8c4] flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-[#b89860]" />
                      <span>Ongkos Jahit per Pcs Dipotong (Rp)</span>
                    </label>
                    <span className="text-xs text-[#5a6270]">Total Batch ({totalCutPieces} pcs): <span className="font-bold text-[#6ea87a]">Rp {totalCost.toLocaleString('id-ID')}</span></span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 items-center">
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      placeholder="Cth: 8500"
                      className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040]/70 rounded-xl text-[#e2e6ed] text-sm font-semibold focus:border-[#4a6d8c] outline-none"
                      value={costPerPcs}
                      onChange={(e) => setCostPerPcs(Number(e.target.value))}
                    />

                    <label className="flex items-center gap-2.5 cursor-pointer bg-[#0c0f17] p-2.5 rounded-xl border border-[#2a3040]/70 select-none">
                      <input
                        type="checkbox"
                        checked={isPaidDirectly}
                        onChange={(e) => setIsPaidDirectly(e.target.checked)}
                        className="w-4 h-4 rounded text-[#6ea87a] bg-[#1a2030] border-[#2a3040] focus:ring-[#4a6d8c]/20 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-[#b0b8c4]">
                        {isPaidDirectly ? 'Status: Sudah Dibayar Langsung' : 'Status: Belum Dibayar (Hutang Jahit)'}
                      </span>
                    </label>
                  </div>
                </div>

                {totalCutPieces > 0 && effectiveFabricUsed > 0 && (
                  <div className="text-center p-2.5 bg-[#0e1219] border border-[#1e2330] rounded-xl text-xs text-[#8899aa]">
                    Efisiensi Potong Total: <span className="font-bold text-[#6ea87a] text-sm">{currentYield} pcs / meter</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 text-sm sm:text-base font-bold bg-[#3d5a80] hover:bg-[#b89860] text-[#e2e6ed] rounded-xl transition-all shadow-sm active:scale-[0.99]"
                >
                  Simpan Hasil Produksi (+{qty} Bagus, +{qtyReject} Reject)
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Riwayat Batch Terakhir with Date & Payment Filter */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col">
          {/* Header Panel */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b89860]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Batch Produksi</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">
                {filteredHistory.length} dari {history.length} Batch
              </span>
            </div>

            {/* Total Summary Widget */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Total Potong:</span>
                <span className="font-extrabold text-[#7a8a9a] font-mono text-xs sm:text-sm">
                  {totalFilteredCutPieces} pcs
                </span>
                <div className="flex items-center gap-1.5 text-[0.65rem] text-[#7a8a9a] mt-0.5">
                  <span className="text-[#8ab896]">{totalFilteredGoodQty} Bagus</span>
                  <span>•</span>
                  <span className="text-[#c8a870]">{totalFilteredRejectQty} Reject</span>
                </div>
              </div>
              <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Hutang Jahit:</span>
                <span className="font-extrabold text-[#b89860] font-mono text-xs sm:text-sm">
                  Rp {totalUnpaidNominal.toLocaleString('id-ID')}
                </span>
                <span className="text-[0.65rem] text-[#5a6270] mt-0.5">
                  {unpaidCount} batch belum lunas
                </span>
              </div>
            </div>

            {/* Filter Tanggal (Default: Hari Ini) */}
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
                    className="text-[#7a8a9a] hover:text-[#aab8c8] flex items-center gap-0.5 normal-case font-medium"
                  >
                    <X className="w-3 h-3" /> Reset (Semua)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setDateFilter('TODAY')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === 'TODAY'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('7_DAYS')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === '7_DAYS'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('30_DAYS')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === '30_DAYS'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  1 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('ALL')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    dateFilter === 'ALL'
                      ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Custom Date Range Toggle Button */}
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'CUSTOM' ? 'TODAY' : 'CUSTOM')}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[0.65rem] font-bold flex items-center justify-between transition-all border ${
                  dateFilter === 'CUSTOM'
                    ? 'bg-[#1a2030] text-[#aab8c8] border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border-[#1e2330]'
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

              {/* Custom Date Range Inputs */}
              {dateFilter === 'CUSTOM' && (
                <div className="p-2.5 bg-[#0c0f17] border border-[#2a3848] rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[0.6rem] font-semibold text-[#5a6270] mb-0.5">Dari Tanggal</label>
                      <input 
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.6rem] font-semibold text-[#5a6270] mb-0.5">Sampai Tanggal</label>
                      <input 
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Status Bayar */}
            <div className="space-y-1.5 pt-1 border-t border-[#1e2330]">
              <span className="block text-[0.65rem] font-bold text-[#5a6270] uppercase tracking-wider">Status Pembayaran</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterPayment('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-bold transition-colors ${
                    filterPayment === 'ALL'
                      ? 'bg-[#222a3a] text-[#e2e6ed]'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPayment('UNPAID')}
                  className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-bold transition-colors ${
                    filterPayment === 'UNPAID'
                      ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                      : 'bg-[#0c0f17] text-[#b89860]/70 hover:text-[#c8a870] border border-[#1e2330]'
                  }`}
                >
                  Belum Bayar ({unpaidCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPayment('PAID')}
                  className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-bold transition-colors ${
                    filterPayment === 'PAID'
                      ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30]'
                      : 'bg-[#0c0f17] text-[#6ea87a]/70 hover:text-[#8ab896] border border-[#1e2330]'
                  }`}
                >
                  Sudah Bayar ({filteredHistory.length - unpaidCount})
                </button>
              </div>
            </div>
          </div>

          {/* List of Batches */}
          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[480px]">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270] space-y-1">
                <p className="font-semibold text-[#8899aa]">Tidak ada riwayat batch untuk filter ini.</p>
                <p className="text-[0.7rem] text-[#5a6270]">
                  {dateFilter === 'TODAY' ? 'Belum ada batch dicatat hari ini. Coba pilih filter "7 Hari" atau "Semua".' : 'Coba ubah filter tanggal atau status pembayaran di atas.'}
                </p>
              </div>
            ) : (
              filteredHistory.map(b => {
                const totalBatchPcs = (b.qty || 0) + (b.qtyReject || 0);
                const batchTotalCost = totalBatchPcs * b.costPerPcs;
                return (
                  <div key={b.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#5a6270] text-[0.7rem]">#{b.id} • {b.date}</span>
                      <span className="text-[0.65rem] px-2 py-0.5 bg-[#1a2030] text-[#8899aa] font-bold rounded border border-[#2a3040]">
                        {b.yield} pcs/meter
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-[#e2e6ed] text-xs">{b.article}</p>
                      <div className="flex items-center justify-between text-[0.7rem] text-[#5a6270] pt-0.5">
                        <span>Warna: <span className="text-[#b0b8c4] font-medium">{b.variant}</span></span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#8ab896] font-semibold">+{b.qty} Bagus</span>
                          {b.qtyReject > 0 && (
                            <span className="text-[#c8a870] font-semibold">+{b.qtyReject} Reject</span>
                          )}
                          <span className="text-[#5a6270]">({b.fabricUsed}m)</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Row with Status Indicator, Edit & Delete */}
                    <div className="pt-2 border-t border-[#1e2330] flex items-center justify-between">
                      <div className="text-[0.7rem]">
                        <span className="text-[#5a6270]">Ongkos ({totalBatchPcs} pcs): </span>
                        <span className="font-mono font-bold text-[#b0b8c4]">Rp {batchTotalCost.toLocaleString('id-ID')}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {b.paid ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentConfirm(b)}
                            title="Klik untuk ubah status ke Belum Bayar"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#1a2a20] hover:bg-[#4a6d8c]/25 text-[#6ea87a] border border-[#2a3a30] text-[0.65rem] font-bold transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sudah Dibayar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentConfirm(b)}
                            title="Klik untuk tandai sudah dibayar"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#b89860] hover:bg-[#c8a870] text-[#0c0f17] text-[0.65rem] font-extrabold shadow-sm transition-all active:scale-95"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Tandai Bayar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingBatch(b)}
                          className="p-1 rounded-md bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] transition-colors"
                          title="Edit Batch"
                        >
                          <Pencil className="w-3 h-3 text-[#7a8a9a]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBatch(b)}
                          className="p-1 rounded-md bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] transition-colors"
                          title="Hapus Batch"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Reject Inventory Overview Modal */}
      {showRejectInventoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-2xl p-5 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#201e1a] text-[#c8a870] flex items-center justify-center border border-[#3a3020]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#e2e6ed]">Inventori Barang Reject (Cacat / Afkir)</h3>
                  <p className="text-[0.7rem] text-[#5a6270]">Total Terkumpul: <strong className="text-[#c8a870]">{totalRejectStockAll} pcs</strong> di semua artikel</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRejectInventoryModal(false)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-[#1e2330] pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {allVariantsRejectList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#e2e6ed]">{item.articleName}</p>
                      <p className="text-[0.7rem] text-[#5a6270] mt-0.5">Warna: <span className="text-[#b0b8c4]">{item.color}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#201e1a] border border-[#3a3020] text-[#c8a870] font-extrabold font-mono text-xs">
                        {item.rejectStock} pcs Reject
                      </span>
                      <p className="text-[0.6rem] text-[#5a6270] mt-0.5">Siap Jual: {item.finishedStock} pcs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2330] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRejectInventoryModal(false)}
                className="py-2 px-4 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#b89860]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Batch Produksi #{editingBatch.id}</h3>
              </div>
              <button 
                onClick={() => setEditingBatch(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Artikel & Varian</label>
                <input
                  type="text"
                  disabled
                  value={`${editingBatch.article} (${editingBatch.variant})`}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[#5a6270] text-xs font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Tanggal Produksi</label>
                <input
                  type="date"
                  required
                  value={editingBatch.date}
                  onChange={(e) => setEditingBatch({ ...editingBatch, date: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8ab896] mb-1">Jumlah Bagus (Pcs)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingBatch.qty}
                    onChange={(e) => setEditingBatch({ ...editingBatch, qty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#8ab896] text-sm font-bold focus:border-[#6ea87a] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c8a870] mb-1">Jumlah Reject (Pcs)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingBatch.qtyReject || 0}
                    onChange={(e) => setEditingBatch({ ...editingBatch, qtyReject: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#3a3020] rounded-xl text-[#c8a870] text-sm font-bold focus:border-[#b89860] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kain Terpakai (Meter)</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    value={editingBatch.fabricUsed}
                    onChange={(e) => setEditingBatch({ ...editingBatch, fabricUsed: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Ongkos per Pcs (Rp)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={editingBatch.costPerPcs}
                    onChange={(e) => setEditingBatch({ ...editingBatch, costPerPcs: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#3d5a80] hover:bg-[#b89860] text-[#e2e6ed] transition-all shadow-sm active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Batch Confirmation Modal */}
      {deletingBatch && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Batch Produksi"
          itemName={`#${deletingBatch.id} • ${deletingBatch.article} (${deletingBatch.variant})`}
          details={[
            `Hasil Jadi Bagus: +${deletingBatch.qty} pcs`,
            `Hasil Reject: +${deletingBatch.qtyReject || 0} pcs`,
            `Total Potong: ${(deletingBatch.qty || 0) + (deletingBatch.qtyReject || 0)} pcs`,
            `Kain Terpakai: ${deletingBatch.fabricUsed} meter`,
            `Total Ongkos: Rp ${(((deletingBatch.qty || 0) + (deletingBatch.qtyReject || 0)) * deletingBatch.costPerPcs).toLocaleString('id-ID')}`,
            `Tanggal: ${deletingBatch.date}`,
          ]}
          onConfirm={handleConfirmDeleteBatch}
          onCancel={() => setDeletingBatch(null)}
        />
      )}

      {/* Confirmation Dialog for Payment Status Change */}
      {pendingPaymentAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                pendingPaymentAction.paid 
                  ? 'bg-[#201e1a] text-[#b89860] border border-[#3a3020]' 
                  : 'bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30]'
              }`}>
                {pendingPaymentAction.paid ? <Clock className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#e2e6ed] tracking-tight">
                  {pendingPaymentAction.paid ? 'Batalkan Pembayaran?' : 'Konfirmasi Pembayaran Ongkos Jahit'}
                </h3>
                <p className="text-[0.7rem] text-[#5a6270] mt-0.5">
                  Batch #{pendingPaymentAction.id} • {pendingPaymentAction.article} ({pendingPaymentAction.variant})
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1.5 text-xs text-[#8899aa]">
              <div className="flex justify-between">
                <span className="text-[#5a6270]">Total Potong:</span>
                <span className="font-semibold text-[#e2e6ed]">
                  {(pendingPaymentAction.qty || 0) + (pendingPaymentAction.qtyReject || 0)} pcs ({pendingPaymentAction.qty} Bagus, {pendingPaymentAction.qtyReject || 0} Reject)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5a6270]">Total Ongkos Jahit:</span>
                <span className="font-bold text-[#6ea87a] font-mono">
                  Rp {(((pendingPaymentAction.qty || 0) + (pendingPaymentAction.qtyReject || 0)) * pendingPaymentAction.costPerPcs).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="pt-1 text-[0.7rem] text-[#5a6270] border-t border-[#1e2330]">
                {pendingPaymentAction.paid 
                  ? 'Status akan dikembalikan menjadi BELUM DIBAYAR (Hutang Jahit).'
                  : 'Status akan ditandai SUDAH DIBAYAR (Lunas) untuk penjahit/konveksi.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingPaymentAction(null)}
                className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentAction}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs text-[#e2e6ed] transition-all shadow-sm active:scale-95 ${
                  pendingPaymentAction.paid
                    ? 'bg-[#3d5a80] hover:bg-[#b89860]'
                    : 'bg-[#3d5a80] hover:bg-[#4a6d8c]'
                }`}
              >
                {pendingPaymentAction.paid ? 'Ya, Batalkan' : 'Ya, Sudah Dibayar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showModal} title="Produksi Berhasil Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}


