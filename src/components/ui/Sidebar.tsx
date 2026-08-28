'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Factory, 
  ShoppingBag, 
  Menu, 
  Layers, 
  PackagePlus, 
  Receipt, 
  FileSpreadsheet, 
  Database, 
  Shirt, 
  Scissors,
  Search,
  Wallet
} from 'lucide-react';
import PWAInstallButton from './PWAInstallButton';
import ThemeToggle from './ThemeToggle';

// Mobile Bottom Nav Items (Compact)
const mobileNavItems = [
  { label: 'Beranda', path: '/', icon: LayoutDashboard },
  { label: 'Produksi', path: '/produksi', icon: Factory },
  { label: 'Jual', path: '/penjualan', icon: ShoppingBag },
  { label: 'Laporan', path: '/laporan', icon: FileSpreadsheet },
  { label: 'Menu', path: '/master', icon: Menu },
];

// Desktop Categorized Nav Sections
const desktopNavSections = [
  {
    category: 'Utama',
    items: [
      { label: 'Ringkasan Eksekutif', path: '/', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Operasional Manufaktur',
    items: [
      { label: '1. Pembelian Bahan', path: '/pembelian', icon: PackagePlus },
      { label: '2. Hasil Produksi', path: '/produksi', icon: Factory },
      { label: '3. Penjualan & Margin', path: '/penjualan', icon: ShoppingBag },
    ]
  },
  {
    category: 'Finansial & Evaluasi',
    items: [
      { label: 'Pengeluaran Operasional', path: '/pengeluaran', icon: Receipt },
      { label: 'Laporan P&L & Excel', path: '/laporan', icon: FileSpreadsheet, highlight: true },
    ]
  },
  {
    category: 'Master Data & Setup',
    items: [
      { label: 'Katalog & Resep BOM', path: '/master', icon: Layers },
      { label: 'Saldo Awal & Migrasi', path: '/master/saldo-awal', icon: Wallet },
      { label: 'Setup Database', path: '/setup', icon: Database },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="
      fixed bottom-0 left-0 z-50 w-full h-16 
      bg-[#0e1219]/95 backdrop-blur-md border-t border-[#1e2330]
      flex items-center justify-around px-2
      shadow-[0_-4px_20px_rgba(0,0,0,0.4)]
      md:top-0 md:bottom-auto md:w-64 md:h-screen md:flex-col md:justify-between md:border-t-0 md:border-r md:border-[#1e2330] md:bg-[#0c0f17] md:px-3 md:py-5 overflow-y-auto
    ">
      {/* Top Brand & Desktop Navigation */}
      <div className="hidden md:flex flex-col w-full">
        {/* Brand Logo Header (Desktop only) */}
        <div className="flex items-center justify-between px-2 pb-4 mb-3 border-b border-[#1e2330] w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a2030] border border-[#2a3040] flex items-center justify-center text-[#7eb3db] shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-black text-[#e2e6ed] tracking-wider uppercase">MANUFAKTUR</h1>
              <p className="text-[0.6rem] font-medium text-[#5a6270] tracking-wider">Garment & Cashflow</p>
            </div>
          </div>
          <ThemeToggle variant="compact" />
        </div>

        {/* Quick Command Palette Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="w-full flex items-center justify-between px-3 py-2 mb-3 rounded-xl bg-[#121620] border border-[#1e2838] hover:border-[#2a3848] text-[#8899aa] hover:text-[#e2e6ed] text-xs transition-all shadow-inner group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#5a6270] group-hover:text-[#7eb3db]" />
            <span className="text-[0.7rem]">Cari menu...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-[#1a2030] text-[#7a8a9a] text-[0.6rem] font-mono border border-[#2a3040]">
            Ctrl K
          </kbd>
        </button>

        {/* Desktop Categorized Navigation */}
        <div className="flex flex-col gap-4">
          {desktopNavSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <span className="px-2.5 text-[0.62rem] font-extrabold text-[#5a6270] uppercase tracking-wider block">
                {section.category}
              </span>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150
                        ${isActive
                          ? 'text-[#e2e6ed] font-bold bg-[#1a2030] border border-[#2a3848] shadow-sm'
                          : item.highlight
                            ? 'text-[#7eb3db] hover:bg-[#151a24] hover:text-[#e2e6ed]'
                            : 'text-[#8899aa] hover:text-[#e2e6ed] hover:bg-[#151a24]'
                        }
                      `}
                    >
                      <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#7eb3db] bg-[#121822]' : 'text-[#5a6270]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Items (Bottom Bar) */}
      <nav className="flex w-full justify-around md:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-[0.62rem] font-medium transition-all duration-150
                ${isActive
                  ? 'text-[#7eb3db] font-bold'
                  : 'text-[#5a6270] hover:text-[#8899aa]'
                }
              `}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#7eb3db] bg-[#1a2030]' : 'text-[#5a6270]'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="tracking-tight truncate">{item.label}</span>

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-[#7eb3db]"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar Bottom (Theme Toggle & PWA Install) */}
      <div className="hidden md:flex flex-col gap-2 w-full pt-3 border-t border-[#1e2330]">
        <ThemeToggle variant="full" />
        <PWAInstallButton variant="sidebar" />
      </div>
    </aside>
  );
}




