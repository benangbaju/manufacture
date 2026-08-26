'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  Store, 
  AlertTriangle, 
  Clock, 
  Check, 
  Pencil, 
  Trash2, 
  Calendar, 
  CalendarDays, 
  X, 
  DollarSign, 
  Package,
  Sparkles,
  Tag
} from 'lucide-react';

interface ColorVariant {
  color: string;
  stock: number;         // Stok Siap Jual (Grade A)
  rejectStock: number;   // Stok Barang Reject (Cacat / Afkir)
  priceSuggest: number;  // Harga Jual Reguler
  priceSuggestReject: number; // Harga Obral / Cuci Gudang
}

interface ArticleItem {
  id: number;
  name: string;
  colors: ColorVariant[];
}

interface SaleRecord {
  id: number;
  date: string;
  article: string;
  variant: string;
  channel: string;
  itemGrade: 'grade_a' | 'reject';
  qty: number;
  price: number;
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';
type GradeFilterOption = 'ALL' | 'GRADE_A' | 'REJECT';

const dummyArticles: ArticleItem[] = [
  { 
    id: 1, 
    name: 'Kemeja Lengan Panjang', 
    colors: [
      { color: 'Putih', stock: 120, rejectStock: 4, priceSuggest: 110000, priceSuggestReject: 45000 },
      { color: 'Hitam', stock: 95, rejectStock: 2, priceSuggest: 110000, priceSuggestReject: 45000 },
      { color: 'Navy', stock: 75, rejectStock: 1, priceSuggest: 110000, priceSuggestReject: 45000 },
    ]
  },
  { 
    id: 2, 
    name: 'Celana Chino Pendek', 
    colors: [
      { color: 'Khaki', stock: 80, rejectStock: 3, priceSuggest: 95000, priceSuggestReject: 40000 },
      { color: 'Hitam', stock: 110, rejectStock: 5, priceSuggest: 95000, priceSuggestReject: 40000 },
    ]
  },
  { 
    id: 3, 
    name: 'Kaos Polos Oversize', 
    colors: [
      { color: 'Putih', stock: 200, rejectStock: 6, priceSuggest: 75000, priceSuggestReject: 35000 },
      { color: 'Hitam', stock: 180, rejectStock: 4, priceSuggest: 75000, priceSuggestReject: 35000 },
      { color: 'Abu-abu', stock: 140, rejectStock: 3, priceSuggest: 75000, priceSuggestReject: 35000 },
    ]
  },
];

const dummyChannels = ['Shopee', 'TikTok Shop', 'Website', 'Offline Store', 'WhatsApp'];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const initialSales: SaleRecord[] = [
  { id: 206, date: getTodayDateString(), article: 'Kemeja Lengan Panjang', variant: 'Putih', channel: 'Offline Store', itemGrade: 'reject', qty: 2, price: 90000 },
  { id: 205, date: getTodayDateString(), article: 'Kemeja Lengan Panjang', variant: 'Putih', channel: 'Shopee', itemGrade: 'grade_a', qty: 2, price: 220000 },
  { id: 204, date: getTodayDateString(), article: 'Kaos Polos Oversize', variant: 'Hitam', channel: 'TikTok Shop', itemGrade: 'grade_a', qty: 5, price: 375000 },
  { id: 203, date: '2026-08-24', article: 'Celana Chino Pendek', variant: 'Khaki', channel: 'WhatsApp', itemGrade: 'grade_a', qty: 1, price: 95000 },
  { id: 202, date: '2026-08-20', article: 'Kemeja Lengan Panjang', variant: 'Navy', channel: 'Offline Store', itemGrade: 'grade_a', qty: 3, price: 330000 },
  { id: 201, date: '2026-08-10', article: 'Kaos Polos Oversize', variant: 'Putih', channel: 'Shopee', itemGrade: 'grade_a', qty: 4, price: 300000 },
];

export default function PenjualanPage() {
  // Form State
  const [itemGrade, setItemGrade] = useState<'grade_a' | 'reject'>('grade_a');
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(initialSales);

  // Filters (Default: TODAY)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('TODAY');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<GradeFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & CRUD State
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [deletingSale, setDeletingSale] = useState<SaleRecord | null>(null);

  const activeArticle = dummyArticles.find(a => a.id === selectedArticle);
  const activeColorObj = activeArticle?.colors.find(c => c.color === selectedColor);

  const availableStock = activeColorObj 
    ? (itemGrade === 'grade_a' ? activeColorObj.stock : activeColorObj.rejectStock)
    : 0;

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    const col = activeArticle?.colors.find(c => c.color === colorName);
    if (col && qty > 0) {
      const unitPrice = itemGrade === 'grade_a' ? col.priceSuggest : col.priceSuggestReject;
      setPrice(unitPrice * qty);
    }
  };

  const handleGradeChange = (newGrade: 'grade_a' | 'reject') => {
    setItemGrade(newGrade);
    if (activeColorObj && qty > 0) {
      const unitPrice = newGrade === 'grade_a' ? activeColorObj.priceSuggest : activeColorObj.priceSuggestReject;
      setPrice(unitPrice * qty);
    }
  };

  const handleQtyChange = (newQty: number) => {
    setQty(newQty);
    if (activeColorObj && newQty > 0) {
      const unitPrice = itemGrade === 'grade_a' ? activeColorObj.priceSuggest : activeColorObj.priceSuggestReject;
      setPrice(unitPrice * newQty);
    }
  };

  const isStockInsufficient = activeColorObj ? qty > availableStock : false;

  // Create Sale
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !selectedColor || !selectedChannel || qty <= 0 || price <= 0) return;

    const newSale: SaleRecord = {
      id: salesHistory.length > 0 ? Math.max(...salesHistory.map(s => s.id)) + 1 : 200,
      date: getTodayDateString(),
      article: activeArticle.name,
      variant: selectedColor,
      channel: selectedChannel,
      itemGrade,
      qty,
      price,
    };

    setSalesHistory([newSale, ...salesHistory]);

    const remaining = availableStock - qty;
    const lines = [
      `Produk: ${activeArticle.name} (${selectedColor})`,
      `Kategori Kualitas: ${itemGrade === 'grade_a' ? 'Barang Bagus (Grade A / Siap Jual)' : 'Barang Reject (Cuci Gudang / B-Grade)'}`,
      `Channel: ${selectedChannel}`,
      `Jumlah Terjual: ${qty} pcs`,
      `Total Omset: Rp ${price.toLocaleString('id-ID')}`,
      itemGrade === 'grade_a'
        ? `Stok Siap Jual berkurang: -${qty} pcs (Sisa: ${remaining} pcs)`
        : `Stok Reject berkurang: -${qty} pcs (Sisa: ${remaining} pcs)`,
    ];

    setModalLines(lines);
    setShowModal(true);

    setSelectedArticle(null);
    setSelectedColor('');
    setSelectedChannel('');
    setQty(0);
    setPrice(0);
  };

  // Update (Edit) Sale
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    setSalesHistory(prev => prev.map(s => s.id === editingSale.id ? editingSale : s));
    setEditingSale(null);
  };

  // Delete Sale
  const handleConfirmDelete = () => {
    if (!deletingSale) return;
    setSalesHistory(prev => prev.filter(s => s.id !== deletingSale.id));
    setDeletingSale(null);
  };

  // Date Filtering Logic
  const matchesDateFilter = (dateStr: string) => {
    const todayStr = getTodayDateString();
    
    if (dateFilter === 'TODAY') {
      return dateStr === todayStr;
    }
    
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

  // Filtered History
  const filteredSales = salesHistory.filter(s => {
    if (channelFilter !== 'ALL' && s.channel !== channelFilter) return false;
    if (gradeFilter === 'GRADE_A' && s.itemGrade !== 'grade_a') return false;
    if (gradeFilter === 'REJECT' && s.itemGrade !== 'reject') return false;
    if (!matchesDateFilter(s.date)) return false;
    return true;
  });

  const totalFilteredQty = filteredSales.reduce((acc, curr) => acc + curr.qty, 0);
  const regularOmset = filteredSales
    .filter(s => s.itemGrade === 'grade_a')
    .reduce((acc, curr) => acc + curr.price, 0);
  const rejectOmset = filteredSales
    .filter(s => s.itemGrade === 'reject')
    .reduce((acc, curr) => acc + curr.price, 0);
  const totalFilteredOmset = regularOmset + rejectOmset;

  return (
    <div>
      <PageHeader 
        title="Catat Transaksi Penjualan" 
        description="Pencatatan order keluar per channel dengan pemisahan jelas antara Barang Bagus (Grade A) dan Penjualan Reject" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Step 0: Pilih Kategori Kualitas */}
            <div>
              <label className="block text-xs font-bold text-[#8899aa] uppercase tracking-wider mb-2">
                Pilih Mutu / Kategori Penjualan:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleGradeChange('grade_a')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    itemGrade === 'grade_a'
                      ? 'bg-[#1a2a20] border-[#2a3a30] text-[#8ab896] shadow-sm ring-1 ring-[#6ea87a]/30'
                      : 'bg-[#0c0f17] border-[#1e2330] text-[#5a6270] hover:text-[#8899aa]'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-[#6ea87a]" />
                      <span>Barang Bagus (Grade A)</span>
                    </div>
                    <p className="text-[0.65rem] text-[#7a8a9a] mt-0.5">Penjualan reguler, potong Stok Siap Jual</p>
                  </div>
                  {itemGrade === 'grade_a' && <Check className="w-4 h-4 text-[#6ea87a]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleGradeChange('reject')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    itemGrade === 'reject'
                      ? 'bg-[#201e1a] border-[#3a3020] text-[#c8a870] shadow-sm ring-1 ring-[#b89860]/30'
                      : 'bg-[#0c0f17] border-[#1e2330] text-[#5a6270] hover:text-[#8899aa]'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                      <Tag className="w-4 h-4 text-[#b89860]" />
                      <span>Barang Reject (Cuci Gudang)</span>
                    </div>
                    <p className="text-[0.65rem] text-[#7a8a9a] mt-0.5">Bazar / obral afkir, potong Stok Reject</p>
                  </div>
                  {itemGrade === 'reject' && <Check className="w-4 h-4 text-[#b89860]" />}
                </button>
              </div>
            </div>

            {/* Step 1: Pilih Produk */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">1</span>
                <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Produk Baju</label>
              </div>
              <select
                className="w-full p-3.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm sm:text-base focus:border-[#4a6d8c] outline-none font-medium appearance-none cursor-pointer"
                value={selectedArticle || ''}
                onChange={(e) => { setSelectedArticle(Number(e.target.value)); setSelectedColor(''); }}
                required
              >
                <option value="" disabled>-- Pilih dari 21 Artikel --</option>
                {dummyArticles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              {activeArticle && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 animate-in fade-in duration-200">
                  {activeArticle.colors.map(c => {
                    const currentStock = itemGrade === 'grade_a' ? c.stock : c.rejectStock;
                    const isSelected = selectedColor === c.color;
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => handleSelectColor(c.color)}
                        className={`p-3 rounded-xl text-left transition-all border ${
                          isSelected 
                            ? (itemGrade === 'grade_a' 
                                ? 'bg-[#1a2a20] text-[#8ab896] border-[#2a3a30] shadow-sm' 
                                : 'bg-[#201e1a] text-[#c8a870] border-[#3a3020] shadow-sm')
                            : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{c.color}</p>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <p className="text-[0.7rem] text-[#5a6270] mt-1">
                          {itemGrade === 'grade_a' ? 'Stok Siap Jual: ' : 'Stok Reject: '}
                          <span className={`font-bold ${currentStock > 0 ? 'text-[#b0b8c4]' : 'text-[#b85c5c]'}`}>
                            {currentStock} pcs
                          </span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Pilih Channel */}
            {selectedColor && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">2</span>
                  <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Channel Penjualan</label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dummyChannels.map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                        selectedChannel === ch 
                          ? (itemGrade === 'grade_a' ? 'bg-[#1a2a20] text-[#8ab896] border-[#2a3a30]' : 'bg-[#201e1a] text-[#c8a870] border-[#3a3020]')
                          : 'bg-[#0e1219] text-[#8899aa] border-[#1e2330] hover:bg-[#1a2030]'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Input Qty & Price */}
            {selectedChannel && activeColorObj && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {isStockInsufficient && (
                  <div className="p-3.5 bg-[#2a1a1a] border border-[#3a2828] rounded-xl text-[#c87070] text-xs font-semibold flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#b85c5c] shrink-0" />
                    <span>
                      Peringatan: Qty penjualan ({qty} pcs) melebihi {itemGrade === 'grade_a' ? 'stok siap jual' : 'stok reject'} di gudang ({availableStock} pcs)!
                    </span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8899aa] mb-1.5 text-center">
                      Jumlah Terjual (Pcs) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="0"
                      className="w-full p-3.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                      value={qty || ''}
                      onChange={(e) => handleQtyChange(Number(e.target.value))}
                    />
                    <p className="text-[0.65rem] text-[#5a6270] text-center mt-1">
                      Tersedia: {availableStock} pcs {itemGrade === 'grade_a' ? '(Siap Jual)' : '(Reject)'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8899aa] mb-1.5 text-center">
                      Total Harga Jual (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      placeholder="0"
                      className="w-full p-3.5 text-2xl font-black text-center bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                    <p className="text-[0.65rem] text-[#7a8a9a] text-center mt-1">
                      {itemGrade === 'grade_a' 
                        ? `Saran Reguler: Rp ${activeColorObj.priceSuggest.toLocaleString('id-ID')}/pcs`
                        : `Saran Cuci Gudang: Rp ${activeColorObj.priceSuggestReject.toLocaleString('id-ID')}/pcs`}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3.5 text-sm sm:text-base font-bold rounded-xl transition-all shadow-sm active:scale-[0.99] ${
                    itemGrade === 'grade_a'
                      ? 'bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed]'
                      : 'bg-[#b89860] hover:bg-[#c8a870] text-[#0c0f17]'
                  }`}
                >
                  Simpan Penjualan {itemGrade === 'grade_a' ? 'Barang Bagus (Grade A)' : 'Barang Reject (Cuci Gudang)'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Riwayat Penjualan Terakhir with Filter, Edit & Delete */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col">
          {/* Header Panel */}
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#6ea87a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Penjualan</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">
                {filteredSales.length} dari {salesHistory.length} Transaksi
              </span>
            </div>

            {/* Total Summary Widget with Separation */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Total Terjual:</span>
                <span className="font-extrabold text-[#7a8a9a] font-mono text-xs sm:text-sm">
                  {totalFilteredQty} pcs
                </span>
                <span className="text-[0.65rem] text-[#5a6270] mt-0.5">
                  Semua transaksi filter
                </span>
              </div>
              <div className="p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Total Omset:</span>
                <span className="font-extrabold text-[#6ea87a] font-mono text-xs sm:text-sm">
                  Rp {totalFilteredOmset.toLocaleString('id-ID')}
                </span>
                <div className="flex items-center gap-1 text-[0.6rem] text-[#7a8a9a] mt-0.5">
                  <span className="text-[#8ab896]">Reg: Rp {(regularOmset/1000).toFixed(0)}k</span>
                  {rejectOmset > 0 && <span className="text-[#c8a870]">• Rj: Rp {(rejectOmset/1000).toFixed(0)}k</span>}
                </div>
              </div>
            </div>

            {/* Filter Mutu / Grade */}
            <div className="space-y-1.5 pt-1 border-t border-[#1e2330]">
              <span className="block text-[0.65rem] font-bold text-[#5a6270] uppercase tracking-wider">Filter Mutu Barang</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setGradeFilter('ALL')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    gradeFilter === 'ALL'
                      ? 'bg-[#1a2030] text-[#e2e6ed] border border-[#2a3848]'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  Semua Mutu
                </button>
                <button
                  type="button"
                  onClick={() => setGradeFilter('GRADE_A')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    gradeFilter === 'GRADE_A'
                      ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30]'
                      : 'bg-[#0c0f17] text-[#6ea87a]/70 hover:text-[#8ab896] border border-[#1e2330]'
                  }`}
                >
                  Hanya Grade A
                </button>
                <button
                  type="button"
                  onClick={() => setGradeFilter('REJECT')}
                  className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                    gradeFilter === 'REJECT'
                      ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                      : 'bg-[#0c0f17] text-[#b89860]/70 hover:text-[#c8a870] border border-[#1e2330]'
                  }`}
                >
                  Hanya Reject
                </button>
              </div>
            </div>

            {/* Date Filters (Default: Hari Ini) */}
            <div className="space-y-2 pt-1 border-t border-[#1e2330]">
              <div className="flex items-center justify-between text-[0.65rem] font-bold text-[#5a6270] uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#8899aa]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#6ea87a]" />
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
                    className="text-[#6ea87a] hover:text-[#8ab896] flex items-center gap-0.5 normal-case font-medium"
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
                      ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30] shadow-sm'
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
                      ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30] shadow-sm'
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
                      ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30] shadow-sm'
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
                      ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30] shadow-sm'
                      : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border border-[#1e2330]'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Custom Date Range Toggle */}
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'CUSTOM' ? 'TODAY' : 'CUSTOM')}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[0.65rem] font-bold flex items-center justify-between transition-all border ${
                  dateFilter === 'CUSTOM'
                    ? 'bg-[#1a2a20] text-[#8ab896] border-[#2a3a30]'
                    : 'bg-[#0c0f17] text-[#5a6270] hover:text-[#b0b8c4] border-[#1e2330]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#6ea87a]" />
                  <span>Pilih Rentang Waktu Kustom</span>
                </span>
                <span className="text-[0.6rem] opacity-70">
                  {dateFilter === 'CUSTOM' ? 'Aktif' : 'Atur Tanggal \u2192'}
                </span>
              </button>

              {/* Custom Date Range Inputs */}
              {dateFilter === 'CUSTOM' && (
                <div className="p-2.5 bg-[#0c0f17] border border-[#2a3a30] rounded-xl space-y-2 animate-in fade-in duration-150">
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

            {/* Filter Channel */}
            <div className="space-y-1.5 pt-1 border-t border-[#1e2330]">
              <span className="block text-[0.65rem] font-bold text-[#5a6270] uppercase tracking-wider">Channel</span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full p-1.5 bg-[#0c0f17] border border-[#1e2330] rounded-lg text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none font-medium"
              >
                <option value="ALL">Semua Channel</option>
                {dummyChannels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* List of Sales */}
          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[480px]">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270] space-y-1">
                <p className="font-semibold text-[#8899aa]">Tidak ada transaksi penjualan untuk filter ini.</p>
                <p className="text-[0.7rem] text-[#5a6270]">
                  {dateFilter === 'TODAY' ? 'Belum ada transaksi hari ini. Coba pilih filter "7 Hari" atau "Semua".' : 'Coba ubah filter tanggal atau channel di atas.'}
                </p>
              </div>
            ) : (
              filteredSales.map(s => (
                <div key={s.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-[#1a2030] text-[#8899aa] border border-[#2a3040] text-[0.65rem] font-bold">
                        {s.channel}
                      </span>
                      {s.itemGrade === 'reject' ? (
                        <span className="px-2 py-0.5 rounded bg-[#201e1a] text-[#c8a870] border border-[#3a3020] text-[0.65rem] font-bold flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> Reject
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#1a2a20] text-[#6ea87a] border border-[#2a3a30] text-[0.65rem] font-bold">
                          Grade A
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[#5a6270] text-[0.7rem]">#{s.id} • {s.date}</span>
                  </div>

                  <div>
                    <p className="font-bold text-[#e2e6ed] text-xs">{s.article} ({s.variant})</p>
                    <div className="flex items-center justify-between text-[0.7rem] pt-1 text-[#8899aa]">
                      <span>Qty: <strong className="text-[#e2e6ed]">{s.qty} pcs</strong></span>
                      <span className="font-bold text-[#6ea87a] font-mono text-xs">
                        Rp {s.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="pt-2 border-t border-[#1e2330] flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingSale(s)}
                      className="p-1.5 px-2 rounded-lg bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] hover:text-[#e2e6ed] text-[0.65rem] font-semibold flex items-center gap-1 transition-colors"
                      title="Edit Penjualan"
                    >
                      <Pencil className="w-3 h-3 text-[#7a8a9a]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSale(s)}
                      className="p-1.5 px-2 rounded-lg bg-[#2a1a1a] hover:bg-[#2a1a1a] text-[#b85c5c] border border-[#3a2828] text-[0.65rem] font-semibold flex items-center gap-1 transition-colors"
                      title="Hapus Penjualan"
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

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#6ea87a]" />
                <h3 className="text-sm font-bold text-[#e2e6ed]">Edit Transaksi Penjualan #{editingSale.id}</h3>
              </div>
              <button 
                onClick={() => setEditingSale(null)}
                className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Artikel & Varian</label>
                <input
                  type="text"
                  disabled
                  value={`${editingSale.article} (${editingSale.variant})`}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[#5a6270] text-xs font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Kualitas Mutu</label>
                  <select
                    value={editingSale.itemGrade}
                    onChange={(e) => setEditingSale({ ...editingSale, itemGrade: e.target.value as 'grade_a' | 'reject' })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                  >
                    <option value="grade_a">Grade A (Siap Jual)</option>
                    <option value="reject">Reject (Cuci Gudang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Channel Penjualan</label>
                  <select
                    value={editingSale.channel}
                    onChange={(e) => setEditingSale({ ...editingSale, channel: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs font-medium focus:border-[#4a6d8c] outline-none cursor-pointer appearance-none"
                  >
                    {dummyChannels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={editingSale.date}
                    onChange={(e) => setEditingSale({ ...editingSale, date: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs focus:border-[#4a6d8c] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8899aa] mb-1">Jumlah Terjual (Pcs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingSale.qty}
                    onChange={(e) => setEditingSale({ ...editingSale, qty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8899aa] mb-1">Total Omset (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={editingSale.price}
                  onChange={(e) => setEditingSale({ ...editingSale, price: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-sm font-bold focus:border-[#4a6d8c] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2330]">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
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
      {deletingSale && (
        <DeleteConfirmModal
          isOpen={true}
          title="Hapus Transaksi Penjualan"
          itemName={`#${deletingSale.id} • ${deletingSale.article} (${deletingSale.variant})`}
          details={[
            `Kualitas: ${deletingSale.itemGrade === 'grade_a' ? 'Grade A (Bagus)' : 'Reject (Cuci Gudang)'}`,
            `Channel: ${deletingSale.channel}`,
            `Jumlah Terjual: ${deletingSale.qty} pcs`,
            `Total Omset: Rp ${deletingSale.price.toLocaleString('id-ID')}`,
            `Tanggal: ${deletingSale.date}`,
          ]}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingSale(null)}
        />
      )}

      <ConfirmModal isOpen={showModal} title="Penjualan Berhasil Disimpan!" lines={modalLines} onClose={() => setShowModal(false)} />
    </div>
  );
}
