'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Factory, 
  ShoppingBag, 
  Menu, 
  Layers 
} from 'lucide-react';
import PWAInstallButton from './PWAInstallButton';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { label: 'Beranda', path: '/', icon: LayoutDashboard },
  { label: 'Produksi', path: '/produksi', icon: Factory },
  { label: 'Jual', path: '/penjualan', icon: ShoppingBag },
  { label: 'Menu', path: '/master', icon: Menu },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="
      fixed bottom-0 left-0 z-50 w-full h-16 
      bg-[#0e1219]/95 backdrop-blur-md border-t border-[#1e2330]
      flex items-center justify-around px-2
      shadow-[0_-4px_20px_rgba(0,0,0,0.4)]
      md:top-0 md:bottom-auto md:w-64 md:h-screen md:flex-col md:justify-start md:border-t-0 md:border-r md:border-[#1e2330] md:bg-[#0c0f17] md:px-3.5 md:py-6
    ">
      {/* Brand Logo Header (Desktop only) */}
      <div className="hidden md:flex items-center justify-between px-2 pb-5 mb-5 border-b border-[#1e2330] w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1a2030] border border-[#2a3040] flex items-center justify-center text-[#8899aa] shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-[#e2e6ed] tracking-tight">MANUFAKTUR</h1>
            <p className="text-[0.6rem] font-medium text-[#5a6270] tracking-wider uppercase">Internal App</p>
          </div>
        </div>
        <ThemeToggle variant="compact" />
      </div>


      {/* Navigation Items (4 Bottom Items) */}
      <nav className="flex w-full justify-around md:flex-col md:justify-start md:gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                relative flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl text-[0.65rem] font-medium transition-all duration-150
                md:flex-row md:justify-start md:gap-3 md:flex-initial md:px-3.5 md:py-2.5 md:text-xs md:font-semibold
                ${isActive
                  ? 'text-[#c8d4e0] font-bold bg-[#1a2030] md:bg-[#1a2030] md:text-[#e2e6ed] md:border md:border-[#2a3040] md:shadow-sm'
                  : 'text-[#5a6270] hover:text-[#8899aa] md:hover:bg-[#151a24]'
                }
              `}
            >
              <div className={`p-0.5 md:p-1 rounded-lg transition-colors ${isActive ? 'text-[#8899aa]' : 'text-[#5a6270]'}`}>
                <Icon className={`w-5 h-5 md:w-4 md:h-4 ${isActive ? 'text-[#8899aa]' : 'text-[#5a6270]'}`} />
              </div>
              <span className="tracking-tight truncate">{item.label}</span>

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="md:hidden absolute -bottom-0.5 w-5 h-0.5 rounded-full bg-[#6b8aaf]"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* PWA Install Button (Desktop Sidebar Bottom) */}
      <PWAInstallButton variant="sidebar" />
    </aside>
  );
}




