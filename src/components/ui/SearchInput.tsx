'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  className = '',
  size = 'sm',
}: SearchInputProps) {
  const isSm = size === 'sm';

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`${
          isSm ? 'w-3.5 h-3.5 left-3' : 'w-4 h-4 left-3.5'
        } text-[#5a6270] absolute top-1/2 -translate-y-1/2 pointer-events-none`}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${
          isSm ? 'pl-8 pr-7 py-1.5 text-xs' : 'pl-9 pr-8 py-2 text-xs sm:text-sm'
        } bg-[#0c0f17] border border-[#2a3040] rounded-xl text-[#e2e6ed] placeholder-[#4a5568] focus:border-[#7eb3db] outline-none transition-colors`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a6270] hover:text-[#e2e6ed] text-xs font-bold p-0.5 rounded cursor-pointer"
          title="Hapus pencarian"
        >
          ✕
        </button>
      )}
    </div>
  );
}
