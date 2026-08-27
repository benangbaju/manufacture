'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  PackagePlus, 
  Factory, 
  ShoppingBag, 
  Receipt, 
  FileSpreadsheet, 
  Shirt, 
  Scissors, 
  Tag, 
  Link2, 
  Layers, 
  Store, 
  Database, 
  LayoutDashboard,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  category: 'Transaksi' | 'Laporan & Finansial' | 'Master & Formulasi' | 'Sistem';
  icon: any;
  shortcut?: string;
}

const ALL_COMMANDS: CommandItem[] = [
  // Transaksi
  { id: 'beli', title: '1. Catat Pembelian Bahan', desc: 'Input pembelian kain roll & bahan baku BOM dari supplier', href: '/pembelian', category: 'Transaksi', icon: PackagePlus, shortcut: 'B' },
  { id: 'prod', title: '2. Catat Hasil Produksi', desc: 'Input hasil potong Grade A, barang reject, dan kalkulasi yield', href: '/produksi', category: 'Transaksi', icon: Factory, shortcut: 'P' },
  { id: 'jual', title: '3. Catat Penjualan Produk', desc: 'Input penjualan Grade A / reject, margin %, dan channel toko', href: '/penjualan', category: 'Transaksi', icon: ShoppingBag, shortcut: 'J' },
  { id: 'keluar', title: '4. Catat Pengeluaran Operasional', desc: 'Input ads, ongkir kain, gaji tukang potong, listrik, dll', href: '/pengeluaran', category: 'Transaksi', icon: Receipt, shortcut: 'O' },

  // Laporan
  { id: 'lap', title: 'Laporan Laba Rugi (P&L)', desc: 'Analisis P&L berbasis unit cost HPP, laba kotor & bersih', href: '/laporan', category: 'Laporan & Finansial', icon: FileSpreadsheet, shortcut: 'L' },
  { id: 'dash', title: 'Dashboard Ringkasan Eksekutif', desc: 'Ringkasan kas riil, valuasi gudang, dan KPI keuangan', href: '/', category: 'Laporan & Finansial', icon: LayoutDashboard, shortcut: 'D' },

  // Master
  { id: 'm-art', title: 'Master Artikel & Varian SKU', desc: 'Daftar model baju induk dan varian warna', href: '/master/artikel', category: 'Master & Formulasi', icon: Shirt },
  { id: 'm-kain', title: 'Master Stok Kain Roll', desc: 'Kelola stok roll kain meter/yard per warna', href: '/master/kain', category: 'Master & Formulasi', icon: Scissors },
  { id: 'm-raw', title: 'Master Bahan Baku (BOM)', desc: 'Kelola kancing, label, resleting, benang, polybag', href: '/master/bahan-baku', category: 'Master & Formulasi', icon: Tag },
  { id: 'm-map', title: 'Pemetaan Kain ke Varian', desc: 'Hubungkan varian warna artikel ke jenis kain roll', href: '/master/pemetaan-kain', category: 'Master & Formulasi', icon: Link2 },
  { id: 'm-rec', title: 'Resep Produk (BOM)', desc: 'Atur takaran kebutuhan bahan per 1 pcs baju', href: '/master/resep', category: 'Master & Formulasi', icon: Layers },
  { id: 'm-ch', title: 'Channel Penjualan', desc: 'Kelola saluran marketplace (Shopee, TikTok, Tokopedia)', href: '/master/channel', category: 'Master & Formulasi', icon: Store },
  { id: 'm-hub', title: 'Pusat Menu & Pengaturan Master', desc: 'Navigasi lengkap seluruh langkah konfigurasi', href: '/master', category: 'Master & Formulasi', icon: Sparkles },

  // Sistem
  { id: 'sys-db', title: 'Status Database Supabase', desc: 'Cek latensi koneksi dan jumlah data aktif', href: '/setup', category: 'Sistem', icon: Database },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Open / Close listener via keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ALL_COMMANDS;
    return ALL_COMMANDS.filter(cmd => 
      cmd.title.toLowerCase().includes(q) ||
      cmd.desc.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((cmd: CommandItem) => {
    setIsOpen(false);
    setQuery('');
    router.push(cmd.href);
  }, [router]);

  // Keyboard navigation within list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-[#121620] border border-[#2a3848] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleListKeyDown}
      >
        {/* Search Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#1e2838] flex items-center gap-3 bg-[#0c1017]">
          <Search className="w-5 h-5 text-[#7eb3db] shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            placeholder="Ketik menu, transaksi, atau laporan (misal: 'produksi', 'hpp', 'kain')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs sm:text-sm text-[#e2e6ed] placeholder-[#4a5568] focus:outline-none"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="text-[#5a6270] hover:text-[#e2e6ed] text-xs font-bold px-1.5"
            >
              ✕
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#1a2030] text-[#7a8a9a] text-[0.65rem] font-mono border border-[#2a3040]">
            ESC
          </kbd>
        </div>

        {/* Command List Results */}
        <div className="overflow-y-auto p-2 divide-y divide-[#1e2330]/50 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5a6270]">
              Tidak ditemukan menu atau perintah yang cocok dengan &quot;{query}&quot;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all group ${
                    isSelected 
                      ? 'bg-[#1a2838] text-[#e2e6ed] border border-[#2a3c50]' 
                      : 'hover:bg-[#151a24] text-[#8899aa]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-[#233548] text-[#7eb3db]' : 'bg-[#1a2030] text-[#5a6270]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#e2e6ed]' : 'text-[#c8d4e0]'}`}>
                          {cmd.title}
                        </span>
                        <span className="text-[0.6rem] px-1.5 py-0.2 rounded bg-[#0c1017] text-[#7a8a9a] border border-[#1e2330] uppercase font-mono hidden sm:inline">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-[#5a6270] truncate mt-0.5">
                        {cmd.desc}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-[#7eb3db] translate-x-0.5' : 'text-transparent'
                  }`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-2.5 px-4 bg-[#0a0d14] border-t border-[#1e2838] flex items-center justify-between text-[0.65rem] text-[#5a6270]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-[#1a2030] text-[#8899aa] font-mono">↑↓</kbd> Navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-[#1a2030] text-[#8899aa] font-mono">↵</kbd> Buka
            </span>
          </div>
          <span className="text-[#7eb3db] font-semibold">
            {filteredCommands.length} Pintasan
          </span>
        </div>
      </div>
    </div>
  );
}
