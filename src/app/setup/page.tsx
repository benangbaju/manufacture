'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { default21Articles, defaultFabrics, defaultRawMaterials, seedDatabase } from "@/lib/services/db";
import { Database, Sparkles, Terminal, Key, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedLogs, setSeedLogs] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRunSeed = async () => {
    setIsSeeding(true);
    setErrorMsg('');
    try {
      const logs = await seedDatabase();
      setSeedLogs(logs);
      setShowModal(true);
    } catch (err: any) {
      console.error('Seeding error:', err);
      setErrorMsg(err.message || 'Gagal menjalankan seeding ke Supabase');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Setup & Koneksi Database" 
        description="Panduan konfigurasi Supabase dan 1-Click Seeder 21 artikel dan stok awal" 
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Step-by-Step Guide */}
        <div className="lg:col-span-2 space-y-5">
          {/* Step 1 */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border-[#1e2330] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1a2030] border border-[#2a3040] text-[#7a8a9a] font-bold flex items-center justify-center text-xs">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">1. Jalankan SQL Schema di Supabase</h2>
                <p className="text-[0.7rem] text-[#5a6270]">Membuat tabel, trigger, view HPP, dan indeks performa</p>
              </div>
            </div>
            <p className="text-xs text-[#8899aa] leading-relaxed">
              Buka dashboard Supabase Anda di browser &rarr; masuk menu <strong className="text-[#e2e6ed]">SQL Editor</strong> &rarr; copy-paste seluruh isi file <code className="text-[#7a8a9a] bg-[#0c0f17] px-2 py-0.5 rounded border border-[#1e2330] font-mono">schema-manufaktur-cashflow.sql</code> &rarr; klik <strong>Run</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border-[#1e2330] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1a2030] border border-[#2a3040] text-[#7a8a9a] font-bold flex items-center justify-center text-xs">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">2. Masukkan Kredensial di .env.local</h2>
                <p className="text-[0.7rem] text-[#5a6270]">Menghubungkan aplikasi Next.js ke database Anda</p>
              </div>
            </div>
            <p className="text-xs text-[#8899aa] leading-relaxed">
              Buka file <code className="text-[#7a8a9a] bg-[#0c0f17] px-2 py-0.5 rounded border border-[#1e2330] font-mono">.env.local</code> di folder project dan isi dengan URL dan Anon Key dari menu <em>Project Settings &rarr; API</em>:
            </p>
            <div className="bg-[#0c0f17] p-3.5 rounded-xl font-mono text-[0.75rem] text-[#8899aa] border border-[#1e2330] space-y-1 overflow-x-auto">
              <p className="text-[#7a8a9a] font-semibold">NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co</p>
              <p className="text-[#5a6270]">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
            </div>
          </div>

          {/* Step 3: One Click Seed Button */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border-[#2a3848] bg-[#151a24] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1a2a20] border border-[#2a3a30] text-[#6ea87a] font-bold flex items-center justify-center text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">3. 1-Click Seeder Data Awal (Otomatis)</h2>
                <p className="text-[0.7rem] text-[#5a6270]">Isi database instan tanpa perlu input manual satu per satu</p>
              </div>
            </div>
            <p className="text-xs text-[#8899aa] leading-relaxed">
              Begitu SQL schema dijalankan dan <code className="text-[#7a8a9a] font-mono">.env.local</code> diisi, klik tombol di bawah untuk otomatis mengisi <strong>21 Master Artikel, ~63 Varian Warna, Stok Kain Awal, Bahan Baku, dan Channel Penjualan</strong> ke database Supabase Anda.
            </p>

            {errorMsg && (
              <div className="p-3.5 bg-[#2a1a1a] border border-[#3a2828] rounded-xl text-[#c87070] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#b85c5c] shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleRunSeed}
              disabled={isSeeding}
              className="w-full py-3.5 text-sm sm:text-base font-bold bg-[#3d5a80] hover:bg-[#4a6d8c] text-[#e2e6ed] rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSeeding ? 'Sedang Memproses Database...' : 'Isi Database Otomatis (21 Artikel & Stok Awal)'}</span>
            </button>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border-[#1e2330]">
            <h3 className="text-xs font-bold text-[#e2e6ed] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#7a8a9a]" />
              <span>Master Data Siap Seed</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#8899aa]">
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Master Artikel</span>
                <span className="font-bold text-[#e2e6ed]">{default21Articles.length} Produk</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Estimasi Varian Warna</span>
                <span className="font-bold text-[#7a8a9a]">~63 SKU</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Daftar Kain per Warna</span>
                <span className="font-bold text-[#e2e6ed]">{defaultFabrics.length} Jenis</span>
              </li>
              <li className="flex justify-between py-2 border-b border-[#1e2330]">
                <span>Bahan Baku Rasio-Tetap</span>
                <span className="font-bold text-[#e2e6ed]">{defaultRawMaterials.length} Item</span>
              </li>
              <li className="flex justify-between py-2">
                <span>Sales Channels</span>
                <span className="font-bold text-[#6ea87a]">5 Channel</span>
              </li>
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-5 border-[#1e2330] text-xs text-[#5a6270] space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#6ea87a]" />
              <span>Arsitektur Internal:</span>
            </div>
            <p className="leading-relaxed">Aplikasi ini dirancang khusus untuk internal bisnis satu akun tanpa role complexity (tanpa RLS) sehingga performa super cepat dan minim latensi.</p>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showModal} 
        title="Database Supabase Berhasil Diisi!" 
        lines={seedLogs} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
