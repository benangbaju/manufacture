'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Shirt, 
  Scissors, 
  Tag, 
  Link2, 
  Layers, 
  Store, 
  Wallet 
} from 'lucide-react';

interface SubNavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
}

const masterTabs: SubNavItem[] = [
  { label: 'Menu Hub', href: '/master', icon: LayoutGrid, exact: true },
  { label: 'Artikel & SKU', href: '/master/artikel', icon: Shirt },
  { label: 'Stok Kain', href: '/master/kain', icon: Scissors },
  { label: 'Bahan Baku', href: '/master/bahan-baku', icon: Tag },
  { label: 'Pemetaan Kain', href: '/master/pemetaan-kain', icon: Link2 },
  { label: 'Resep BOM', href: '/master/resep', icon: Layers },
  { label: 'Channel Toko', href: '/master/channel', icon: Store },
  { label: 'Saldo Awal', href: '/master/saldo-awal', icon: Wallet },
];

export default function MasterSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-5 -mt-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 max-w-full scrollbar-none">
        {masterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact 
            ? pathname === tab.href 
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? 'bg-[#1a2838] text-[#7eb3db] border-[#2a3c50] font-bold shadow-sm'
                  : 'bg-[#0c0f17] text-[#8899aa] hover:text-[#e2e6ed] hover:bg-[#121620] border-[#1e2330]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7eb3db]' : 'text-[#5a6270]'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
