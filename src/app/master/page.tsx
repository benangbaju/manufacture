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
  Smartphone
} from 'lucide-react';
import PWAInstallButton from "@/components/ui/PWAInstallButton";

const menuSections = [
  {
    step: "Langkah 1: Setup Awal",
    sectionTitle: "Integrasi & Channel Penjualan",
    items: [
      { href: '/setup', icon: Database, title: 'Setup Database', desc: 'Koneksi Supabase & status database.' },
      { href: '/master/channel', icon: Store, title: 'Channel Penjualan', desc: 'Kelola channel (Shopee, Web, TikTok, dll).' },
    ]
  },
  {
    step: "Langkah 2: Katalog Induk",
    sectionTitle: "Master Artikel & Inventori Bahan",
    items: [
      { href: '/master/artikel', icon: Shirt, title: 'Artikel & Varian', desc: 'Kelola daftar baju dan warna variannya.' },
      { href: '/master/kain', icon: Scissors, title: 'Stok Kain Roll', desc: 'Kelola kain per warna dan stok meter/yard.' },
      { href: '/master/bahan-baku', icon: Tag, title: 'Bahan Rasio-Tetap', desc: 'Kelola kancing, label, resleting, benang.' },
    ]
  },
  {
    step: "Langkah 3: Formulasi",
    sectionTitle: "Pemetaan Kain & Resep BOM",
    items: [
      { href: '/master/pemetaan-kain', icon: Link2, title: 'Pemetaan Kain', desc: 'Petakan varian warna ke jenis kain roll.' },
      { href: '/master/resep', icon: Layers, title: 'Resep Produk (BOM)', desc: 'Atur rasio kebutuhan bahan per artikel.' },
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

export default function MasterDataPage() {
  return (
    <div>
      <PageHeader 
        title="Menu & Pengaturan Sistem" 
        description="Pusat navigasi dan konfigurasi sistem manufaktur diurutkan secara kronologis dari Langkah 1 (Setup) hingga Langkah 5 (Laporan P&L)" 
      />

      <div className="space-y-6">
        {/* PWA Mobile App Card Banner */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1e2330] pb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#1a2838] text-[#aab8c8] text-[0.65rem] font-extrabold uppercase tracking-wider border border-[#2a3848]">
              Aplikasi PWA
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-[#e2e6ed] tracking-tight">
              Akses Cepat di Smartphone & Desktop
            </h2>
          </div>
          <PWAInstallButton variant="menu-card" />
        </div>

        {menuSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1e2330] pb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#1a2030] text-slate-300 text-[0.65rem] font-extrabold uppercase tracking-wider border border-[#2a3040]">
                {section.step}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-200 tracking-tight">
                {section.sectionTitle}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-200 hover:border-slate-500 text-slate-100 no-underline ${
                      item.highlight ? 'border-[#2a3a30] bg-[#151a24]' : 'border-[#1e2330]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1a2030] border border-[#2a3040] text-slate-300 group-hover:text-white group-hover:bg-[#222a3a] transition-all">
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold !text-white tracking-tight transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs !text-slate-400 mt-1 line-clamp-2 leading-relaxed transition-colors">
                        {item.desc}
                      </p>
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

