'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Link from 'next/link';
import { 
  getDbInitialBalances, 
  saveDbInitialBalances 
} from "@/lib/services/db";
import { 
  Wallet, 
  Scissors, 
  Shirt, 
  Layers, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  HelpCircle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  FileText
} from 'lucide-react';

interface FabricRow {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
  initial_unit_price: number;
}

interface RawMaterialRow {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
  initial_unit_price: number;
}

interface VariantRow {
  id: number;
  article_id: number;
  article_name: string;
  color: string;
  stock_qty: number;
  stock_reject_qty: number;
  initial_hpp: number;
}

export default function SaldoAwalPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cash' | 'materials' | 'products'>('cash');

  // Form states
  const [initialCash, setInitialCash] = useState<number>(0);
  const [cutoffDate, setCutoffDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cutoffNotes, setCutoffNotes] = useState<string>('Saldo awal migrasi sistem');

  const [fabrics, setFabrics] = useState<FabricRow[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Search queries
  const [searchMaterial, setSearchMaterial] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  // Modal feedback
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalLines, setModalLines] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDbInitialBalances();
      setInitialCash(data.initialCash || 0);
      setCutoffDate(data.cutoffDate || new Date().toISOString().split('T')[0]);
      setCutoffNotes(data.cutoffNotes || '');

      setFabrics((data.fabrics || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        unit: f.unit || 'meter',
        stock_qty: Number(f.stock_qty || 0),
        initial_unit_price: Number(f.initial_unit_price || 0),
      })));

      setRawMaterials((data.rawMaterials || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        unit: r.unit || 'pcs',
        stock_qty: Number(r.stock_qty || 0),
        initial_unit_price: Number(r.initial_unit_price || 0),
      })));

      setVariants((data.variants || []).map((v: any) => ({
        id: v.id,
        article_id: v.article_id,
        article_name: v.article_name || 'Artikel',
        color: v.color,
        stock_qty: Number(v.stock_qty || 0),
        stock_reject_qty: Number(v.stock_reject_qty || 0),
        initial_hpp: Number(v.initial_hpp || 0),
      })));
    } catch (err) {
      console.error('Failed to load initial balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update handlers
  const handleFabricChange = (id: number, field: 'stock_qty' | 'initial_unit_price', val: number) => {
    setFabrics(prev => prev.map(f => f.id === id ? { ...f, [field]: Math.max(0, val) } : f));
  };

  const handleRawChange = (id: number, field: 'stock_qty' | 'initial_unit_price', val: number) => {
    setRawMaterials(prev => prev.map(r => r.id === id ? { ...r, [field]: Math.max(0, val) } : r));
  };

  const handleVariantChange = (id: number, field: 'stock_qty' | 'stock_reject_qty' | 'initial_hpp', val: number) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: Math.max(0, val) } : v));
  };

  // Calculations
  const fabricValuation = fabrics.reduce((sum, f) => sum + (f.stock_qty * f.initial_unit_price), 0);
  const rawValuation = rawMaterials.reduce((sum, r) => sum + (r.stock_qty * r.initial_unit_price), 0);
  const totalMaterialValuation = fabricValuation + rawValuation;

  const productGoodValuation = variants.reduce((sum, v) => sum + (v.stock_qty * v.initial_hpp), 0);
  const productRejectValuation = variants.reduce((sum, v) => sum + (v.stock_reject_qty * v.initial_hpp), 0);
  const totalProductValuation = productGoodValuation + productRejectValuation;

  const totalInitialEquity = initialCash + totalMaterialValuation + totalProductValuation;

  // Save All
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveDbInitialBalances({
        initialCash,
        cutoffDate,
        cutoffNotes,
        fabrics: fabrics.map(f => ({ id: f.id, stock_qty: f.stock_qty, initial_unit_price: f.initial_unit_price })),
        rawMaterials: rawMaterials.map(r => ({ id: r.id, stock_qty: r.stock_qty, initial_unit_price: r.initial_unit_price })),
        variants: variants.map(v => ({ id: v.id, stock_qty: v.stock_qty, stock_reject_qty: v.stock_reject_qty, initial_hpp: v.initial_hpp })),
      });

      setModalLines([
        `Saldo Kas Awal: Rp ${initialCash.toLocaleString('id-ID')}`,
        `Valuasi Bahan Mentah: Rp ${totalMaterialValuation.toLocaleString('id-ID')} (${fabrics.length} kain, ${rawMaterials.length} aksesoris)`,
        `Valuasi Produk Jadi: Rp ${totalProductValuation.toLocaleString('id-ID')} (${variants.length} SKU varian)`,
        `Total Modal/Aset Awal: Rp ${totalInitialEquity.toLocaleString('id-ID')}`,
        `Tanggal Cut-off: ${cutoffDate}`,
      ]);
      setShowConfirmModal(true);
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan saldo awal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered lists
  const filteredFabrics = fabrics.filter(f => f.name.toLowerCase().includes(searchMaterial.toLowerCase().trim()));
  const filteredRawMaterials = rawMaterials.filter(r => r.name.toLowerCase().includes(searchMaterial.toLowerCase().trim()));
  const filteredVariants = variants.filter(v => 
    v.article_name.toLowerCase().includes(searchProduct.toLowerCase().trim()) ||
    v.color.toLowerCase().includes(searchProduct.toLowerCase().trim())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />)}
        </div>
        <div className="h-96 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Setup Saldo Awal & Migrasi Data"
        description="Kelola modal awal kas, stok fisik bahan mentah & harga modal beli, serta stok produk jadi & estimasi HPP tanpa memotong kas/kain berjalan"
        action={
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Saldo Awal'}</span>
          </button>
        }
      />

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Saldo Kas */}
        <div 
          onClick={() => setActiveTab('cash')}
          className={`glass-card rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'cash' ? 'border-[#7eb3db] bg-[#162030]' : 'border-[#1e2330] hover:border-[#2a3848]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] font-semibold text-[#8899aa] uppercase tracking-wider">1. Saldo Kas & Bank</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2838] text-[#7eb3db] flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#e2e6ed] font-mono tracking-tight">
            Rp {(initialCash / 1000000).toFixed(2)} jt
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-1">Uang tunai + saldo bank riil</p>
        </div>

        {/* 2. Bahan Mentah */}
        <div 
          onClick={() => setActiveTab('materials')}
          className={`glass-card rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'materials' ? 'border-[#7eb3db] bg-[#162030]' : 'border-[#1e2330] hover:border-[#2a3848]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] font-semibold text-[#8899aa] uppercase tracking-wider">2. Bahan Mentah</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2838] text-[#8ab896] flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#8ab896] font-mono tracking-tight">
            Rp {(totalMaterialValuation / 1000000).toFixed(2)} jt
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-1">{fabrics.length} kain • {rawMaterials.length} aksesoris</p>
        </div>

        {/* 3. Produk Jadi */}
        <div 
          onClick={() => setActiveTab('products')}
          className={`glass-card rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'products' ? 'border-[#7eb3db] bg-[#162030]' : 'border-[#1e2330] hover:border-[#2a3848]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] font-semibold text-[#8899aa] uppercase tracking-wider">3. Baju Jadi</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2838] text-[#c8a870] flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#c8a870] font-mono tracking-tight">
            Rp {(totalProductValuation / 1000000).toFixed(2)} jt
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-1">{variants.length} SKU varian produk</p>
        </div>

        {/* 4. Total Modal Awal */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[#2a3a4a] bg-[#111622]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] font-semibold text-[#8899aa] uppercase tracking-wider">Total Modal & Aset</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a2a20] text-[#8ab896] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#6ea87a] font-mono tracking-tight">
            Rp {(totalInitialEquity / 1000000).toFixed(2)} jt
          </p>
          <p className="text-[0.65rem] text-[#5a6270] mt-1">Total ekuitas saat cut-off</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1e2330] pb-2">
        <button
          onClick={() => setActiveTab('cash')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'cash'
              ? 'bg-[#3d5a80] text-white shadow-sm'
              : 'text-[#8899aa] hover:text-[#e2e6ed] hover:bg-[#1a2030]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Tab 1: Saldo Kas & Bank Awal</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'materials'
              ? 'bg-[#3d5a80] text-white shadow-sm'
              : 'text-[#8899aa] hover:text-[#e2e6ed] hover:bg-[#1a2030]'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Tab 2: Bahan Mentah (Kain & Aksesoris)</span>
          <span className="text-[0.65rem] px-1.5 py-0.5 rounded-lg bg-black/30 font-mono">
            {fabrics.length + rawMaterials.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-[#3d5a80] text-white shadow-sm'
              : 'text-[#8899aa] hover:text-[#e2e6ed] hover:bg-[#1a2030]'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Tab 3: Produk Jadi Siap Jual</span>
          <span className="text-[0.65rem] px-1.5 py-0.5 rounded-lg bg-black/30 font-mono">
            {variants.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SALDO KAS & BANK AWAL */}
      {/* ========================================================= */}
      {activeTab === 'cash' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border-[#1e2330] space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#1e2330]">
              <div className="w-10 h-10 rounded-xl bg-[#1a2838] text-[#7eb3db] flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#e2e6ed]">Formulir Saldo Kas & Rekening Bank Awal</h3>
                <p className="text-[0.7rem] text-[#5a6270]">Masukkan total saldo riil uang kas/bank saat tanggal migrasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1.5">
                  Nominal Saldo Kas Awal (Rp) <span className="text-[#c87070]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5a6270]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={initialCash || ''}
                    onChange={e => setInitialCash(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-base sm:text-lg font-mono font-bold focus:border-[#7eb3db] outline-none"
                  />
                </div>
                {/* Quick Stepper Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5000000, 10000000, 20000000, 50000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialCash(prev => (prev || 0) + amt)}
                      className="px-2.5 py-1 bg-[#121620] hover:bg-[#1a2030] border border-[#1e2838] text-[0.65rem] font-mono text-[#8899aa] hover:text-[#e2e6ed] rounded-lg transition-colors"
                    >
                      +{(amt / 1000000)} Juta
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setInitialCash(0)}
                    className="px-2 py-1 bg-[#241a1a] hover:bg-[#341e1e] border border-[#3a2020] text-[0.65rem] font-mono text-[#c87070] rounded-lg transition-colors"
                  >
                    Reset 0
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#7a8a9a]" />
                    <span>Tanggal Cut-off Saldo Awal</span>
                  </label>
                  <input
                    type="date"
                    value={cutoffDate}
                    onChange={e => setCutoffDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm font-medium focus:border-[#7eb3db] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-bold text-[#8899aa] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#7a8a9a]" />
                    <span>Catatan / Keterangan</span>
                  </label>
                  <input
                    type="text"
                    value={cutoffNotes}
                    onChange={e => setCutoffNotes(e.target.value)}
                    placeholder="Contoh: Saldo Rekening BCA + Kasir Tunai per 1 Agustus"
                    className="w-full p-2.5 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] text-xs sm:text-sm font-medium focus:border-[#7eb3db] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Card */}
          <div className="glass-card rounded-2xl p-5 border-[#1e2330] space-y-4 h-fit text-xs text-[#8899aa]">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Sparkles className="w-4 h-4 text-[#6ea87a]" />
              <span>Mengapa Saldo Kas Awal Penting?</span>
            </div>
            <p className="leading-relaxed">
              Arus kas dihitung secara otomatis oleh sistem Supabase dengan rumus:
            </p>
            <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-[0.7rem] font-mono text-[#7eb3db] leading-relaxed">
              Total Kas Riil = Saldo Kas Awal + Penjualan − Pembelian Baru − Ongkos Jahit − Beban Operasional
            </div>
            <p className="leading-relaxed">
              Dengan mengisi Saldo Kas Awal, saldo kas di <strong>Ringkasan Eksekutif</strong> tidak akan minus dan akan selalu mencerminkan jumlah uang riil di bank serta laci kasir Anda.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BAHAN MENTAH (KAIN & AKSESORIS) */}
      {/* ========================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          {/* Top Info & Search Bar */}
          <div className="glass-card rounded-2xl p-4 border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kain roll atau aksesoris..."
                value={searchMaterial}
                onChange={e => setSearchMaterial(e.target.value)}
                className="w-full pl-9 pr-7 py-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
              {searchMaterial && (
                <button onClick={() => setSearchMaterial('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs">✕</button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="text-[#8899aa]">Valuasi Bahan:</span>
              <span className="font-mono font-bold text-[#8ab896] bg-[#1a2a20] px-2.5 py-1 rounded-xl border border-[#2a3828]">
                Rp {totalMaterialValuation.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Section 2a: Kain Roll */}
          <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
            <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#7eb3db] flex items-center justify-center">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">A. Daftar Stok Kain Roll ({filteredFabrics.length})</h4>
              </div>
              <span className="text-[0.7rem] text-[#5a6270]">Subtotal Kain: <strong className="text-[#7eb3db] font-mono">Rp {fabricValuation.toLocaleString('id-ID')}</strong></span>
            </div>

            {filteredFabrics.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                {fabrics.length === 0 ? (
                  <div>
                    <p className="text-slate-300 font-semibold mb-2">Belum ada master kain terdaftar</p>
                    <Link href="/master/kain" className="text-[#7eb3db] underline font-medium">Daftarkan jenis kain di Master Kain &rarr;</Link>
                  </div>
                ) : 'Tidak ada kain yang cocok dengan pencarian'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#0c0f17] text-[#5a6270] text-[0.68rem] uppercase tracking-wider border-b border-[#1e2330]">
                      <th className="p-3">Nama Kain & Warna</th>
                      <th className="p-3 text-center w-36">Stok Fisik Awal</th>
                      <th className="p-3 text-center w-44">Harga Modal per Meter</th>
                      <th className="p-3 text-right w-40">Subtotal Valuasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {filteredFabrics.map(f => {
                      const subtotal = f.stock_qty * f.initial_unit_price;
                      return (
                        <tr key={f.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-[#e2e6ed]">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#7eb3db]"></span>
                              <span>{f.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={f.stock_qty || ''}
                                onChange={e => handleFabricChange(f.id, 'stock_qty', Number(e.target.value))}
                                className="w-20 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-center font-mono font-bold text-[#e2e6ed] text-xs focus:border-[#7eb3db] outline-none"
                              />
                              <span className="text-[0.65rem] text-[#5a6270]">m</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[0.65rem] text-[#5a6270]">Rp</span>
                              <input
                                type="number"
                                step="1000"
                                min="0"
                                value={f.initial_unit_price || ''}
                                onChange={e => handleFabricChange(f.id, 'initial_unit_price', Number(e.target.value))}
                                placeholder="Contoh: 30000"
                                className="w-28 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-right font-mono font-bold text-[#8ab896] text-xs focus:border-[#7eb3db] outline-none"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2b: Aksesoris / Bahan Baku (BOM) */}
          <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
            <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#8ab896] flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">B. Daftar Aksesoris & Bahan Rasio-Tetap ({filteredRawMaterials.length})</h4>
              </div>
              <span className="text-[0.7rem] text-[#5a6270]">Subtotal Aksesoris: <strong className="text-[#8ab896] font-mono">Rp {rawValuation.toLocaleString('id-ID')}</strong></span>
            </div>

            {filteredRawMaterials.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                {rawMaterials.length === 0 ? (
                  <div>
                    <p className="text-slate-300 font-semibold mb-2">Belum ada bahan baku / aksesoris terdaftar</p>
                    <Link href="/master/bahan-baku" className="text-[#7eb3db] underline font-medium">Daftarkan aksesoris di Master Bahan Baku &rarr;</Link>
                  </div>
                ) : 'Tidak ada aksesoris yang cocok'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#0c0f17] text-[#5a6270] text-[0.68rem] uppercase tracking-wider border-b border-[#1e2330]">
                      <th className="p-3">Nama Bahan / Aksesoris</th>
                      <th className="p-3 text-center w-36">Stok Fisik Awal</th>
                      <th className="p-3 text-center w-44">Harga Modal per Satuan</th>
                      <th className="p-3 text-right w-40">Subtotal Valuasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {filteredRawMaterials.map(r => {
                      const subtotal = r.stock_qty * r.initial_unit_price;
                      return (
                        <tr key={r.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-[#e2e6ed]">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#8ab896]"></span>
                              <span>{r.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={r.stock_qty || ''}
                                onChange={e => handleRawChange(r.id, 'stock_qty', Number(e.target.value))}
                                className="w-20 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-center font-mono font-bold text-[#e2e6ed] text-xs focus:border-[#7eb3db] outline-none"
                              />
                              <span className="text-[0.65rem] text-[#5a6270]">{r.unit}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[0.65rem] text-[#5a6270]">Rp</span>
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={r.initial_unit_price || ''}
                                onChange={e => handleRawChange(r.id, 'initial_unit_price', Number(e.target.value))}
                                placeholder="Contoh: 500"
                                className="w-28 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-right font-mono font-bold text-[#8ab896] text-xs focus:border-[#7eb3db] outline-none"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PRODUK JADI (BAJU SIAP JUAL & REJECT) */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Top Info & Search Bar */}
          <div className="glass-card rounded-2xl p-4 border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5a6270] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama artikel atau warna..."
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                className="w-full pl-9 pr-7 py-2 bg-[#0c0f17] border border-[#2a3040] rounded-xl text-xs text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none"
              />
              {searchProduct && (
                <button onClick={() => setSearchProduct('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs">✕</button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="text-[#8899aa]">Valuasi Baju Jadi:</span>
              <span className="font-mono font-bold text-[#c8a870] bg-[#241f16] px-2.5 py-1 rounded-xl border border-[#3a3020]">
                Rp {totalProductValuation.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border-[#1e2330]">
            <div className="p-4 bg-[#0e1219] border-b border-[#1e2330] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1a2030] text-[#c8a870] flex items-center justify-center">
                  <Shirt className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider">Daftar Varian Produk & Estimasi HPP Modal ({filteredVariants.length} SKU)</h4>
              </div>
            </div>

            {filteredVariants.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5a6270]">
                {variants.length === 0 ? (
                  <div>
                    <p className="text-slate-300 font-semibold mb-2">Belum ada artikel & varian warna terdaftar</p>
                    <Link href="/master/artikel" className="text-[#7eb3db] underline font-medium">Daftarkan artikel di Master Artikel &rarr;</Link>
                  </div>
                ) : 'Tidak ada produk yang cocok'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#0c0f17] text-[#5a6270] text-[0.68rem] uppercase tracking-wider border-b border-[#1e2330]">
                      <th className="p-3">Artikel & Varian Warna</th>
                      <th className="p-3 text-center w-32">Stok Bagus (Grade A)</th>
                      <th className="p-3 text-center w-32">Stok Reject</th>
                      <th className="p-3 text-center w-40">Estimasi HPP Modal/Pcs</th>
                      <th className="p-3 text-right w-40">Subtotal Valuasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {filteredVariants.map(v => {
                      const totalPcs = Number(v.stock_qty || 0) + Number(v.stock_reject_qty || 0);
                      const subtotal = totalPcs * Number(v.initial_hpp || 0);
                      return (
                        <tr key={v.id} className="hover:bg-white/[0.01]">
                          <td className="p-3">
                            <p className="font-bold text-[#e2e6ed]">{v.article_name}</p>
                            <span className="text-[0.7rem] text-[#7eb3db] font-medium">Warna: {v.color}</span>
                          </td>

                          {/* Grade A */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={v.stock_qty || ''}
                              onChange={e => handleVariantChange(v.id, 'stock_qty', Number(e.target.value))}
                              placeholder="0"
                              className="w-20 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-center font-mono font-bold text-[#8ab896] text-xs focus:border-[#7eb3db] outline-none"
                            />
                          </td>

                          {/* Reject */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={v.stock_reject_qty || ''}
                              onChange={e => handleVariantChange(v.id, 'stock_reject_qty', Number(e.target.value))}
                              placeholder="0"
                              className="w-20 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-center font-mono font-bold text-[#c8a870] text-xs focus:border-[#7eb3db] outline-none"
                            />
                          </td>

                          {/* Initial HPP */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[0.65rem] text-[#5a6270]">Rp</span>
                              <input
                                type="number"
                                step="1000"
                                min="0"
                                value={v.initial_hpp || ''}
                                onChange={e => handleVariantChange(v.id, 'initial_hpp', Number(e.target.value))}
                                placeholder="Contoh: 45000"
                                className="w-28 p-1.5 bg-[#0c0f17] border border-[#2a3040] rounded-lg text-right font-mono font-bold text-[#7eb3db] text-xs focus:border-[#7eb3db] outline-none"
                              />
                            </div>
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-[#e2e6ed]">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating / Bottom Save Bar */}
      <div className="p-4 bg-[#121620] border border-[#2a3040] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-[#8899aa]">
          <CheckCircle2 className="w-4 h-4 text-[#6ea87a]" />
          <span>Pastikan data saldo awal telah sesuai dengan fisik gudang & rekening bank Anda sebelum disimpan.</span>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          <span>{isSaving ? 'Menyimpan Semua Saldo Awal...' : 'Simpan Semua Saldo Awal'}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Saldo Awal Berhasil Diperbarui"
        lines={modalLines}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
