'use client';

import React from 'react';

interface MobileStickyFooterProps {
  show: boolean;
  title: string;
  subTitle?: string;
  primaryValue: string;
  valueColor?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
}

export default function MobileStickyFooter({
  show,
  title,
  subTitle,
  primaryValue,
  valueColor = 'text-[#8ab896]',
  submitLabel = 'Simpan',
  isSubmitting = false,
  disabled = false,
  onSubmit,
}: MobileStickyFooterProps) {
  if (!show) return null;

  return (
    <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-[#121824] border-t border-[#2a3848] p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
      <div className="min-w-0">
        <span className="text-[0.65rem] text-[#8899aa] block truncate font-medium">
          {title} {subTitle ? `(${subTitle})` : ''}
        </span>
        <span className={`text-sm font-black font-mono ${valueColor}`}>
          {primaryValue}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled || isSubmitting}
        onClick={onSubmit}
        className="px-4 py-2 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white font-bold text-xs rounded-xl shadow-sm shrink-0 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
      >
        {isSubmitting ? '...' : submitLabel}
      </button>
    </div>
  );
}
