'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  variant?: 'compact' | 'full' | 'header';
}

export default function ThemeToggle({ variant = 'compact' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#1a2030] border border-[#2a3040] opacity-50" />
    );
  }

  const isDark = theme === 'dark';

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="w-full p-2.5 rounded-xl transition-all border flex items-center justify-between group bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[#4a6d8c]"
        title={`Ubah ke ${isDark ? 'Mode Terang (Light)' : 'Mode Gelap (Dark)'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 ${
            isDark ? 'bg-[#1a2838] text-[#c8a870]' : 'bg-[#e2e8f0] text-[#d97706]'
          }`}>
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <span className="text-xs font-semibold">
            {isDark ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)'}
          </span>
        </div>
        <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 group bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[#4a6d8c] hover:bg-[var(--color-surface-hover)] shadow-sm active:scale-95"
      title={`Ubah ke ${isDark ? 'Mode Terang (Light)' : 'Mode Gelap (Dark)'}`}
      aria-label="Toggle Theme"
    >
      <div className="relative w-4 h-4">
        <Sun className={`w-4 h-4 text-amber-500 absolute inset-0 transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`} />
        <Moon className={`w-4 h-4 text-[#c8a870] absolute inset-0 transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`} />
      </div>
      {variant === 'header' && (
        <span className="text-xs font-semibold hidden sm:inline">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
