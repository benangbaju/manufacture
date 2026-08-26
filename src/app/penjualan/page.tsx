'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { 
  getDbArticles, 
  getDbChannels, 
  getDbSales, 
  createDbSale, 
  deleteDbSale 
} from "@/lib/services/db";
import { 
  Store, 
  AlertTriangle, 
  Clock, 
  Check, 
  Trash2, 
  CalendarDays, 
  DollarSign, 
  Tag,
  Plus,
  ShoppingBag
} from 'lucide-react';

interface VariantItem {
  id: number;
  color: string;
  stock_qty: number;
  stock_reject_qty: number;
}

interface ArticleItem {
  id: number;
  name: string;
  variants: VariantItem[];
}

interface ChannelItem {
  id: number;
  name: string;
}

interface SaleRecord {
  id: number;
  sale_date: string;
  article_id: number;
  variant_id: number;
  channel_id: number;
  item_grade: 'grade_a' | 'reject';
  qty: number;
  total_price: number;
  articles?: { name: string };
  variants?: { color: string };
  channels?: { name: string };
}

type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';
type GradeFilterOption = 'ALL' | 'GRADE_A' | 'REJECT';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function PenjualanPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [itemGrade, setItemGrade] = useState<'grade_a' | 'reject'>('grade_a');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [saleDate, setBatchDate] = useState<string>(getTodayDateString());

  // Filters (Default: ALL)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [gradeFilter, setGradeFilter] = useState<GradeFilterOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);
  const [deletingSale, setDeletingSale] = useState<SaleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [artList, chList, saleList] = await Promise.all([
        getDbArticles(),
        getDbChannels(),
        getDbSales(),
      ]);

      setArticles(artList || []);
      setChannels(chList || []);
      setSales(saleList || []);

      if (artList && artList.length > 0 && !selectedArticleId) {
        setSelectedArticleId(artList[0].id);
        if (artList[0].variants && artList[0].variants.length > 0) {
          setSelectedVariantId(artList[0].variants[0].id);
        }
      }
      if (chList && chList.length > 0 && !selectedChannelId) {
        setSelectedChannelId(chList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeArticle = articles.find(a => a.id === selectedArticleId);
  const activeVariant = activeArticle?.variants.find(v => v.id === selectedVariantId);
  const activeChannel = channels.find(c => c.id === selectedChannelId);

  const currentAvailableStock = activeVariant
    ? (itemGrade === 'grade_a' ? Number(activeVariant.stock_qty || 0) : Number(activeVariant.stock_reject_qty || 0))
    : 0;

  const isStockInsufficient = qty > currentAvailableStock;
  const totalPrice = qty * unitPrice;

  const handleArticleSelect = (id: number) => {
    setSelectedArticleId(id);
    const art = articles.find(a => a.id === id);
    if (art && art.variants.length > 0) {
      setSelectedVariantId(art.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !activeVariant || !activeChannel || qty <= 0 || unitPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await createDbSale({
        sale_date: saleDate,
        article_id: activeArticle.id,
        variant_id: activeVariant.id,
        channel_id: activeChannel.id,
        item_grade: itemGrade,
        qty,
        total_price: totalPrice,
      });

      const gradeLabel = itemGrade === 'grade_a' ? 'Grade A (Bagus)' : 'Barang Reject (Afkir)';
      const lines = [
        `Tanggal: ${saleDate}`,
        `Kategori: ${gradeLabel}`,
        `Produk: ${activeArticle.name} - ${activeVariant.color}`,
        `Channel: ${activeChannel.name}`,
        `Jumlah Terjual: ${qty} pcs`,
        `Harga Satuan: Rp ${unitPrice.toLocaleString('id-ID')}`,
        `Total Pemasukan: Rp ${totalPrice.toLocaleString('id-ID')}`,
        `Sisa Stok ${gradeLabel}: ${currentAvailableStock - qty} pcs`,
      ];

      setModalLines(lines);
      setShowModal(true);

      setQty(0);
      setUnitPrice(0);
      await loadData();
    } catch (err: any) {
      alert('Gagal mencatat penjualan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSale) return;
    try {
      await deleteDbSale(deletingSale.id);
      setDeletingSale(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus data penjualan: ' + err.message);
    }
  };

  // Date & Grade Filtering Logic
  const todayStr = getTodayDateString();
  const filteredSales = sales.filter(s => {
    // Grade Filter
    if (gradeFilter === 'GRADE_A' && s.item_grade !== 'grade_a') return false;
    if (gradeFilter === 'REJECT' && s.item_grade !== 'reject') return false;

    // Date Filter
    if (dateFilter === 'TODAY') return s.sale_date === todayStr;
    if (dateFilter === '7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(s.sale_date) >= sevenDaysAgo;
    }
    if (dateFilter === '30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(s.sale_date) >= thirtyDaysAgo;
    }
    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const sDate = new Date(s.sale_date);
      if (customStartDate && sDate < new Date(customStartDate)) return false;
      if (customEndDate && sDate > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  });

  const totalFilteredNominal = filteredSales.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const totalFilteredQty = filteredSales.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div>
      <PageHeader 
        title="Catat Penjualan Produk" 
        description="Pencatatan kas masuk dari transaksi penjualan produk Grade A maupun obral barang reject per channel marketplace" 
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 border-[#1e2330]">
          {articles.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2030] text-[#5a6270] flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#e2e6ed]">Belum ada artikel produk</p>
              <p className="text-xs text-[#5a6270] mt-1 max-w-xs mx-auto">
                Silakan buat artikel dan varian terlebih dahulu di menu <strong>Master Artikel</strong>.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Step 1: Grade Selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#1a2838] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">1</span>
                  <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Kategori Kualitas Barang yang Dijual</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setItemGrade('grade_a');
                      setQty(0);
                    }}
                    className={`p-3.5 rounded-xl text-left transition-all border flex items-center gap-3 ${
                      itemGrade === 'grade_a'
                        ? 'bg-[#1a2a20] border-[#2a3a30] text-[#8ab896] shadow-sm'
                        : 'bg-[#0e1219] border-[#1e2330] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#203428] flex items-center justify-center text-[#8ab896] font-bold">
                      A
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Barang Normal (Grade A)</p>
                      <p className="text-[0.65rem] text-[#5a6270]">Penjualan reguler harga standar</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemGrade('reject');
                      setQty(0);
                    }}
                    className={`p-3.5 rounded-xl text-left transition-all border flex items-center gap-3 ${
                      itemGrade === 'reject'
                        ? 'bg-[#201e1a] border-[#3a3020] text-[#c8a870] shadow-sm'
                        : 'bg-[#0e1219] border-[#1e2330] text-[#5a6270] hover:text-[#8899aa]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#30281e] flex items-center justify-center text-[#c8a870] font-bold">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Barang Reject (Afkir)</p>
                      <p className="text-[0.65rem] text-[#5a6270]">Cuci gudang / diskon cacat produksi</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Pilih Artikel & Tanggal */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-[#1a2838] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">2</span>
                    <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Pilih Artikel</label>
                  </div>
                  <select
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                    value={selectedArticleId || ''}
                    onChange={(e) => handleArticleSelect(Number(e.target.value))}
                    required
                  >
                    {articles.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-[#1a2838] text-[#7a8a9a] font-bold text-xs flex items-center justify-center">3</span>
                    <label className="text-sm font-bold text-[#e2e6ed] tracking-tight">Tanggal Transaksi</label>
                  </div>
                  <input 
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium"
                  />
                </div>
              </div>

              {/* Step 3: Pilih Varian Warna & Channel */}
              {activeArticle && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8899aa] mb-2">Pilih Varian Warna</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {activeArticle.variants.map(v => {
                        const stockVal = itemGrade === 'grade_a' ? v.stock_qty : (v.stock_reject_qty || 0);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`p-3 rounded-xl text-left transition-all border ${
                              selectedVariantId === v.id 
                                ? (itemGrade === 'grade_a' ? 'bg-[#1a2a20] text-[#8ab896] border-[#2a3a30]' : 'bg-[#201e1a] text-[#c8a870] border-[#3a3020]')
                                : 'bg-[#0e1219] text-[#b0b8c4] border-[#1e2330] hover:bg-[#1a2030]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm">{v.color}</p>
                              {selectedVariantId === v.id && <Check className="w-4 h-4" />}
                            </div>
                            <p className="text-[0.7rem] text-[#5a6270] mt-1">
                              Stok {itemGrade === 'grade_a' ? 'Grade A' : 'Reject'}: <strong className={stockVal > 0 ? (itemGrade === 'grade_a' ? 'text-[#8ab896]' : 'text-[#c8a870]') : 'text-[#c87070]'}>{stockVal} pcs</strong>
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                      Pilih Channel Penjualan <span className="text-[#c87070]">*</span>
                    </label>
                    <select
                      value={selectedChannelId || ''}
                      onChange={(e) => setSelectedChannelId(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm focus:border-[#4a6d8c] outline-none font-medium cursor-pointer"
                      required
                    >
                      {channels.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 4: Qty & Price Inputs */}
              {activeVariant && (
                <div className="space-y-4 pt-2 border-t border-[#1e2330]">
                  {isStockInsufficient && (
                    <div className="p-3 bg-[#241a1a] border border-[#3a2020] rounded-xl text-xs text-[#c87070] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Jumlah yang dijual ({qty} pcs) melebihi stok yang tersedia ({currentAvailableStock} pcs).</span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                        Jumlah Terjual (Pcs) <span className="text-[#c87070]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={qty || ''}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full p-3 text-xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[0.7rem] font-semibold text-[#8899aa] uppercase tracking-wider mb-1.5">
                        Harga Jual Satuan per Pcs (Rp) <span className="text-[#c87070]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={unitPrice || ''}
                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                        className="w-full p-3 text-xl font-bold bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] focus:border-[#4a6d8c] outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {totalPrice > 0 && (
                    <div className="p-3.5 bg-[#0e1219] border border-[#1e2330] rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[#8899aa]">Total Pemasukan Kas:</span>
                      <span className="text-base font-black text-[#8ab896]">Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isStockInsufficient}
                    className="w-full py-3 bg-[#3d5a80] hover:bg-[#b89860] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Penjualan'}</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Right Column: Riwayat Penjualan */}
        <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330] flex flex-col h-fit">
          <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7a8a9a]" />
                <h2 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Riwayat Penjualan</h2>
              </div>
              <span className="text-[0.7rem] text-[#5a6270] font-medium">{filteredSales.length} Transaksi</span>
            </div>

            {/* Summary Widget */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Total Terjual:</span>
                <span className="font-extrabold text-[#e2e6ed] text-xs">{totalFilteredQty} pcs</span>
              </div>
              <div className="p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl flex flex-col justify-between">
                <span className="text-[0.65rem] text-[#5a6270]">Total Omset:</span>
                <span className="font-extrabold text-[#8ab896] text-xs">Rp {totalFilteredNominal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                type="button"
                onClick={() => setGradeFilter('ALL')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  gradeFilter === 'ALL'
                    ? 'bg-[#1a2838] text-[#aab8c8] border border-[#2a3848]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('GRADE_A')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  gradeFilter === 'GRADE_A'
                    ? 'bg-[#1a2a20] text-[#8ab896] border border-[#2a3a30]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Grade A
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('REJECT')}
                className={`py-1 rounded-lg text-[0.65rem] font-bold transition-all ${
                  gradeFilter === 'REJECT'
                    ? 'bg-[#201e1a] text-[#c8a870] border border-[#3a3020]'
                    : 'bg-[#0c0f17] text-[#5a6270] border border-[#1e2330]'
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#1e2330] overflow-y-auto max-h-[420px]">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                Belum ada transaksi penjualan dicatat.
              </div>
            ) : (
              filteredSales.map(s => (
                <div key={s.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#e2e6ed]">{s.articles?.name} - {s.variants?.color}</span>
                    <span className="font-mono text-[#5a6270] text-[0.7rem]">{s.sale_date}</span>
                  </div>

                  <div className="flex items-center justify-between text-[0.7rem]">
                    <span className="text-[#8899aa]">{s.channels?.name} ({s.qty} pcs)</span>
                    <span className="font-bold text-[#8ab896]">Rp {(s.total_price || 0).toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between text-[0.65rem] pt-1">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      s.item_grade === 'grade_a' ? 'bg-[#1a2a20] text-[#8ab896]' : 'bg-[#201e1a] text-[#c8a870]'
                    }`}>
                      {s.item_grade === 'grade_a' ? 'Grade A' : 'Reject'}
                    </span>
                    <button
                      onClick={() => setDeletingSale(s)}
                      className="text-[#c87070] hover:underline"
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
        isOpen={Boolean(deletingSale)}
        title="Hapus Data Penjualan"
        message={`Apakah Anda yakin ingin menghapus catatan penjualan #${deletingSale?.id}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingSale(null)}
      />

      {/* Success Notification Modal */}
      <ConfirmModal 
        isOpen={showModal} 
        title="Penjualan Berhasil Disimpan!" 
        lines={modalLines} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
