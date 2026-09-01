'use client';

import React from 'react';
import { DateFilterOption } from '@/lib/utils/date';
import { CalendarDays } from 'lucide-react';

interface DateFilterGroupProps {
  value: DateFilterOption;
  onChange: (val: DateFilterOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomStartChange?: (date: string) => void;
  onCustomEndChange?: (date: string) => void;
}

const filterButtons: { label: string; value: DateFilterOption }[] = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Hari Ini', value: 'TODAY' },
  { label: '7 Hari', value: '7_DAYS' },
  { label: '30 Hari', value: '30_DAYS' },
  { label: 'Bulan Ini', value: 'THIS_MONTH' },
  { label: 'Kustom', value: 'CUSTOM' },
];

export default function DateFilterGroup({
  value,
  onChange,
  customStartDate = '',
  customEndDate = '',
  onCustomStartChange,
  onCustomEndChange,
}: DateFilterGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
        {filterButtons.map((btn) => {
          const isActive = value === btn.value;
          return (
            <button
              key={btn.value}
              type="button"
              onClick={() => onChange(btn.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#3d5a80] text-white shadow-sm'
                  : 'bg-[#121620] hover:bg-[#1a2030] text-[#8899aa] hover:text-[#e2e6ed] border border-[#1e2330]'
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {value === 'CUSTOM' && onCustomStartChange && onCustomEndChange && (
        <div className="flex items-center gap-2 p-2 bg-[#0c0f17] border border-[#1e2330] rounded-xl text-xs">
          <CalendarDays className="w-3.5 h-3.5 text-[#5a6270] shrink-0 ml-1" />
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="bg-[#121620] border border-[#2a3040] rounded-lg px-2 py-1 text-xs text-[#e2e6ed] outline-none"
          />
          <span className="text-[#5a6270]">s/d</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="bg-[#121620] border border-[#2a3040] rounded-lg px-2 py-1 text-xs text-[#e2e6ed] outline-none"
          />
        </div>
      )}
    </div>
  );
}
