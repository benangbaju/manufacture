'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  Receipt, 
  Shirt, 
  Tag, 
  Scissors, 
  Layers, 
  Link2, 
  Store, 
  Database, 
  PackagePlus, 
  Factory, 
  ShoppingBag, 
  ArrowRight, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Wallet
} from 'lucide-react';
import PWAInstallButton from "@/components/ui/PWAInstallButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import MasterSubNav from "@/components/ui/MasterSubNav";
import { 
  getDbArticles, 
  getDbFabricStock, 
  getDbRawMaterials, 
  getDbFabricMappings, 
  getDbRecipes, 
  getDbChannels 
} from "@/lib/services/db";

export default function MasterDataPage() {
  const [counts, setCounts] = useState<{
    channels: number;
    articles: number;
    fabrics: number;
    rawMaterials: number;
    mappings: number;
    recipes: number;
  }>({
    channels: 0,
    articles: 0,
    fabrics: 0,
    rawMaterials: 0,
    mappings: 0,
    recipes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [ch, art, fab, raw, map, rec] = await Promise.all([
          getDbChannels(),
          getDbArticles(),
          getDbFabricStock(),
          getDbRawMaterials(),
          getDbFabricMappings(),
          getDbRecipes(),
        ]);
        setCounts({
          channels: ch?.length || 0,
          articles: art?.length || 0,
          fabrics: fab?.length || 0,
          rawMaterials: raw?.length || 0,
          mappings: map?.length || 0,
          recipes: rec?.length || 0,
        });
      } catch (err) {
        console.error('Failed to load master counts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Compute Onboarding Readiness
  const setupSteps = [
    { label: 'Channel Penjualan', isDone: counts.channels > 0, count: counts.channels, unit: 'toko', href: '/master/channel' },
    { label: 'Master Artikel', isDone: counts.articles > 0, count: counts.articles, unit: 'model', href: '/master/artikel' },
    { label: 'Stok Kain Roll', isDone: counts.fabrics > 0, count: counts.fabrics, unit: 'jenis', href: '/master/kain' },
    { label: 'Bahan Baku BOM', isDone: counts.rawMaterials > 0, count: counts.rawMaterials, unit: 'bahan', href: '/master/bahan-baku' },
    { label: 'Pemetaan Kain', isDone: counts.mappings > 0, count: counts.mappings, unit: 'varian', href: '/master/pemetaan-kain' },
    { label: 'Resep Produk (BOM)', isDone: counts.recipes > 0, count: counts.recipes, unit: 'resep', href: '/master/resep' },
  ];

  const completedSteps = setupSteps.filter(s => s.isDone).length;
  const readinessPct = Math.round((completedSteps / setupSteps.length) * 100);

  interface MenuItem {
    href: string;
    icon: any;
    title: string;
    desc: string;
    badge?: string;
    highlight?: boolean;
  }

  interface MenuSection {
    step: string;
    sectionTitle: string;
    items: MenuItem[];
  }

  const menuSections: MenuSection[] = [
    {
      step: "Langkah 1: Setup Awal & Saldo",
      sectionTitle: "Integrasi, Channel & Saldo Awal",
      items: [
        { href: '/setup', icon: Database, title: 'Setup Database', desc: 'Koneksi Supabase & status database.' },
        { 
          href: '/master/saldo-awal', 
          icon: Wallet, 
          title: 'Saldo Awal & Migrasi', 
          desc: 'Input saldo kas awal, stok kain, bahan, dan baju jadi cut-off.',
          highlight: true 
        },
        { 
          href: '/master/channel', 
          icon: Store, 
          title: 'Channel Penjualan', 
          desc: 'Kelola channel (Shopee, Web, TikTok, dll).',
          badge: counts.channels > 0 ? `${counts.channels} Channel` : 'Belum Ada'
        },
      ]
    },
    {
      step: "Langkah 2: Katalog Induk",
      sectionTitle: "Master Artikel & Inventori Bahan",
      items: [
        { 
          href: '/master/artikel', 
          icon: Shirt, 
          title: 'Artikel & Varian', 
          desc: 'Kelola daftar baju dan warna variannya.',
          badge: counts.articles > 0 ? `${counts.articles} Artikel` : 'Belum Ada'
        },
        { 
          href: '/master/kain', 
          icon: Scissors, 
          title: 'Stok Kain Roll', 
          desc: 'Kelola kain per warna dan stok meter/yard.',
          badge: counts.fabrics > 0 ? `${counts.fabrics} Kain` : 'Belum Ada'
        },
        { 
          href: '/master/bahan-baku', 
          icon: Tag, 
          title: 'Bahan Rasio-Tetap', 
          desc: 'Kelola kancing, label, resleting, benang.',
          badge: counts.rawMaterials > 0 ? `${counts.rawMaterials} Bahan` : 'Belum Ada'
        },
      ]
    },
    {
      step: "Langkah 3: Formulasi",
      sectionTitle: "Pemetaan Kain & Resep BOM",
      items: [
        { 
          href: '/master/pemetaan-kain', 
          icon: Link2, 
          title: 'Pemetaan Kain', 
          desc: 'Petakan varian warna ke jenis kain roll.',
          badge: counts.mappings > 0 ? `${counts.mappings} Terpetakan` : 'Belum Ada'
        },
        { 
          href: '/master/resep', 
          icon: Layers, 
          title: 'Resep Produk (BOM)', 
          desc: 'Atur rasio kebutuhan bahan per artikel.',
          badge: counts.recipes > 0 ? `${counts.recipes} Resep` : 'Belum Ada'
        },
      ]
    },
    {
      step: "Langkah 4: Operasional",
      sectionTitle: "Workflow Manufaktur Harian",
      items: [
        { href: '/pembelian', icon: PackagePlus, title: '1. Pembelian Bahan', desc: 'Catat pengadaan kain & bahan baku dari supplier.' },
        { href: '/produksi', icon: Factory, title: '2. Produksi & Reject', desc: 'Catat hasil potong Grade A & barang reject.' },
        { href: '/penjualan', icon: ShoppingBag, title: '3. Penjualan Produk', desc: 'Catat penjualan produk Grade A / reject.' },
      ]
    },
    {
      step: "Langkah 5: Finansial",
      sectionTitle: "Pengeluaran & Laporan Keuangan",
      items: [
        { href: '/pengeluaran', icon: Receipt, title: 'Catat Pengeluaran', desc: 'Catat ads, ongkir kain, gaji, listrik dll.' },
        { href: '/laporan', icon: FileSpreadsheet, title: 'Laporan Keuangan & P&L', desc: 'Ringkasan laba rugi, omset & download Excel.', highlight: true },
      ]
    }
  ];

  return (
    <div>
      <PageHeader 
        title="Menu & Pengaturan Sistem" 
        description="Pusat navigasi dan konfigurasi sistem manufaktur diurutkan secara kronologis dari Langkah 1 (Setup) hingga Langkah 5 (Laporan P&L)" 
      />

      <MasterSubNav />

      <div className="space-y-6">
        {/* Master Setup Onboarding Progress Tracker */}
        <div className="glass-card rounded-2xl p-5 border-[#233548] bg-gradient-to-r from-[#121722] via-[#10141e] to-[#141a24] shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1a2838] border border-[#2a3848] text-[#7eb3db] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#e2e6ed] tracking-tight">Kesiapan Master Data & Resep</h2>
                <p className="text-[0.7rem] text-[#8899aa]">Pastikan seluruh konfigurasi dasar terisi sebelum memulai pencatatan produksi harian</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                readinessPct === 100 
                  ? 'bg-[#1a2a20] text-[#8ab896] border-[#2a3a30]' 
                  : 'bg-[#201e1a] text-[#c8a870] border-[#3a3020]'
              }`}>
                {loading ? '...' : `${completedSteps} dari ${setupSteps.length} Langkah (${readinessPct}%)`}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#0c0f17] rounded-full overflow-hidden border border-[#1e2330] mb-4">
            <div 
              style={{ width: `${readinessPct}%` }}
              className={`h-full transition-all duration-500 ${
                readinessPct === 100 ? 'bg-[#8ab896]' : 'bg-[#7eb3db]'
              }`}
            />
          </div>

          {/* 6 Step Checkmark Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {setupSteps.map((step, i) => (
              <Link 
                key={i} 
                href={step.href}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm min-w-0 ${
                  step.isDone 
                    ? 'bg-[#0f1712] border-[#1e3022] text-[#8ab896]' 
                    : 'bg-[#15120f] border-[#2c2018] text-[#c8a870]'
                }`}
              >
                <div className="flex items-center justify-between text-[0.68rem] mb-1.5 font-bold gap-1 min-w-0">
                  <span className="truncate">{step.label}</span>
                  {step.isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8ab896] shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-[#c8a870] shrink-0" />
                  )}
                </div>
                <span className="text-[0.65rem] font-mono font-bold text-[#e2e6ed] truncate">
                  {loading ? '...' : step.isDone ? `${step.count} ${step.unit}` : 'Belum diisi'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* PWA & Theme Settings Row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1e2330] pb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#1a2838] text-[#aab8c8] text-[0.65rem] font-extrabold uppercase tracking-wider border border-[#2a3848]">
              Preferensi & Aplikasi
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-[#e2e6ed] tracking-tight">
              Tampilan Tema & Akses Cepat PWA
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <PWAInstallButton variant="menu-card" />
            <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-[#1e2330]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a2030] border border-[#2a3040] flex items-center justify-center text-[#c8a870]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#1a2030] border border-[#2a3040] text-[#aab8c8] text-[0.65rem] font-extrabold uppercase tracking-wider">
                    Tema Aktif
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-[#e2e6ed]">
                  Mode Tampilan (Dark / Light)
                </h3>
                <p className="text-[0.7rem] text-[#8899aa] mt-1 leading-relaxed">
                  Pilih tema gelap untuk kenyamanan mata di ruangan redup atau tema terang untuk pencahayaan terang.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#1e2330]">
                <ThemeToggle variant="full" />
              </div>
            </div>
          </div>
        </div>

        {menuSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1e2330] pb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#1a2838] text-[#7eb3db] text-[0.65rem] font-extrabold uppercase tracking-wider border border-[#2a3848]">
                {section.step}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-[#e2e6ed] tracking-tight">
                {section.sectionTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-200 border hover:border-[#2a3c50] ${
                      item.highlight ? 'border-[#233548] bg-[#121822]' : 'border-[#1e2330]'
                    }`}
                  >
                    <div className="flex sm:block items-start gap-3.5">
                      <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-[#1a2030] border border-[#2a3040] text-[#7eb3db] group-hover:bg-[#121822] group-hover:scale-105 transition-all shrink-0 sm:mb-3">
                        <Icon className="w-5 h-5 sm:w-4.5 sm:h-4.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-bold text-[#e2e6ed] group-hover:text-[#7eb3db] tracking-tight transition-colors truncate">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(item as any).badge && (
                              <span className="px-2 py-0.5 rounded-lg text-[0.65rem] font-bold bg-[#121822] border border-[#233548] text-[#7eb3db]">
                                {(item as any).badge}
                              </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-[#5a6270] group-hover:text-[#7eb3db] group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                        <p className="text-xs text-[#8899aa] line-clamp-2 leading-relaxed transition-colors">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

