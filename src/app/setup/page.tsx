'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Database, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import Link from 'next/link';

export default function SetupPage() {
  const [checking, setChecking] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [tableCounts, setTableCounts] = useState<{ [key: string]: number }>({});
  const [errorMessage, setErrorMessage] = useState('');

  const checkConnection = async () => {
    setChecking(true);
    setErrorMessage('');
    try {
      if (!isSupabaseConfigured()) {
        setIsConnected(false);
        setErrorMessage('Supabase URL atau Anon Key belum terpasang di .env.local');
        return;
      }

      const [artRes, fabRes, rawRes, chRes, batchRes, saleRes] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('fabric_stock').select('*', { count: 'exact', head: true }),
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }),
        supabase.from('sales_channels').select('*', { count: 'exact', head: true }),
        supabase.from('production_batches').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*', { count: 'exact', head: true }),
      ]);

      if (artRes.error) throw artRes.error;

      setTableCounts({
        articles: artRes.count || 0,
        fabric_stock: fabRes.count || 0,
        raw_materials: rawRes.count || 0,
        sales_channels: chRes.count || 0,
        production_batches: batchRes.count || 0,
        sales: saleRes.count || 0,
      });

      setIsConnected(true);
    } catch (err: any) {
      console.error('Supabase connection check error:', err);
      setIsConnected(false);
      setErrorMessage(err.message || 'Gagal terhubung ke Supabase');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div>
      <PageHeader 
        title="Status Koneksi & Database Supabase" 
        description="Monitoring koneksi langsung ke backend Supabase PostgreSQL dan statistik tabel data aktif" 
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-5">
          {/* Connection Status Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border-[#1e2330] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isConnected 
                    ? 'bg-[#1a2a20] border border-[#2a3a30] text-[#6ea87a]' 
                    : 'bg-[#2a1a1a] border border-[#3a2828] text-[#c87070]'
                }`}>
                  {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Status Koneksi Supabase</h2>
                  <p className="text-[0.7rem] text-[#5a6270]">
                    {isConnected ? 'Terhubung secara realtime ke Supabase Cloud' : 'Belum terhubung atau koneksi bermasalah'}
                  </p>
                </div>
              </div>

              <button
                onClick={checkConnection}
                disabled={checking}
                className="p-2.5 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] border border-[#2a3040] text-[#aab8c8] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>Cek Ulang</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-[#2a1a1a] border border-[#3a2828] rounded-xl text-[#c87070] text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="p-3.5 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[0.7rem]">
                <span className="text-[#5a6270]">Project URL:</span>
                <span className="font-mono text-[#8899aa]">https://ljqgyjespfryqoigamum.supabase.co</span>
              </div>
              <div className="flex justify-between items-center text-[0.7rem]">
                <span className="text-[#5a6270]">Status Backend:</span>
                <span className="font-bold text-[#6ea87a]">Database Online (RLS Off / Single-User Mode)</span>
              </div>
            </div>
          </div>

          {/* Quick Start Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border-[#1e2330] space-y-4">
            <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7a8a9a]" />
              <span>Panduan Input Data Real Anda</span>
            </h3>
            <p className="text-xs text-[#8899aa] leading-relaxed">
              Database telah dibersihkan dari seluruh data mockup/dummy. Anda dapat langsung menginput data manufaktur riil dengan urutan alur berikut:
            </p>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <Link href="/master/artikel" className="p-3.5 bg-[#0c0f17] border border-[#1e2330] hover:border-[#4a6d8c] rounded-xl block transition-all group">
                <span className="text-[0.65rem] text-[#7a8a9a] font-bold">Langkah 1</span>
                <p className="font-bold text-[#e2e6ed] group-hover:text-[#aab8c8] mt-0.5">Master Artikel & Varian &rarr;</p>
                <p className="text-[0.7rem] text-[#5a6270] mt-1">Daftarkan nama produk dan varian warna.</p>
              </Link>

              <Link href="/master/kain" className="p-3.5 bg-[#0c0f17] border border-[#1e2330] hover:border-[#4a6d8c] rounded-xl block transition-all group">
                <span className="text-[0.65rem] text-[#7a8a9a] font-bold">Langkah 2</span>
                <p className="font-bold text-[#e2e6ed] group-hover:text-[#aab8c8] mt-0.5">Master Stok Kain &rarr;</p>
                <p className="text-[0.7rem] text-[#5a6270] mt-1">Catat roll kain per warna atau jenis kain.</p>
              </Link>

              <Link href="/master/bahan-baku" className="p-3.5 bg-[#0c0f17] border border-[#1e2330] hover:border-[#4a6d8c] rounded-xl block transition-all group">
                <span className="text-[0.65rem] text-[#7a8a9a] font-bold">Langkah 3</span>
                <p className="font-bold text-[#e2e6ed] group-hover:text-[#aab8c8] mt-0.5">Bahan Baku & Aksesoris &rarr;</p>
                <p className="text-[0.7rem] text-[#5a6270] mt-1">Kancing, resleting, label, hangtag, dsb.</p>
              </Link>

              <Link href="/produksi" className="p-3.5 bg-[#0c0f17] border border-[#1e2330] hover:border-[#4a6d8c] rounded-xl block transition-all group">
                <span className="text-[0.65rem] text-[#7a8a9a] font-bold">Langkah 4</span>
                <p className="font-bold text-[#e2e6ed] group-hover:text-[#aab8c8] mt-0.5">Catat Produksi & Reject &rarr;</p>
                <p className="text-[0.7rem] text-[#5a6270] mt-1">Stok Grade A & Reject terpisah otomatis.</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
            <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#7a8a9a]" />
              <span>Jumlah Data Real di Database</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#8899aa]">
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Artikel Produk</span>
                <span className="font-mono font-bold text-[#e2e6ed]">{tableCounts.articles ?? 0} data</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Stok Kain Roll</span>
                <span className="font-mono font-bold text-[#e2e6ed]">{tableCounts.fabric_stock ?? 0} data</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Bahan Baku / BOM</span>
                <span className="font-mono font-bold text-[#e2e6ed]">{tableCounts.raw_materials ?? 0} data</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Channel Penjualan</span>
                <span className="font-mono font-bold text-[#e2e6ed]">{tableCounts.sales_channels ?? 0} data</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Batch Produksi</span>
                <span className="font-mono font-bold text-[#e2e6ed]">{tableCounts.production_batches ?? 0} data</span>
              </li>
              <li className="flex justify-between py-2">
                <span>Transaksi Penjualan</span>
                <span className="font-mono font-bold text-[#e2e6ed]">{tableCounts.sales ?? 0} data</span>
              </li>
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-5 border-[#1e2330] text-xs text-[#5a6270] space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#6ea87a]" />
              <span>Arsitektur Supabase:</span>
            </div>
            <p className="leading-relaxed">Aplikasi berkomunikasi langsung dengan Supabase PostgreSQL via Client SDK. Seluruh mutasi stok Grade A dan Reject terhitung secara presisi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
