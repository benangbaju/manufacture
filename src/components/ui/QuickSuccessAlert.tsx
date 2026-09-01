'use client';

import React from 'react';
import { CheckCircle2, LucideIcon } from 'lucide-react';

interface QuickSuccessAlertProps {
  message: string | null;
  onClose: () => void;
  icon?: LucideIcon;
  className?: string;
}

export default function QuickSuccessAlert({
  message,
  onClose,
  icon: Icon = CheckCircle2,
  className = '',
}: QuickSuccessAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-4 p-3 bg-[#1a2a20] border border-[#2a3a30] text-[#8ab896] rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-[#8ab896]/70 hover:text-[#8ab896] text-xs font-bold px-1 py-0.5 rounded hover:bg-[#203428] transition-colors cursor-pointer shrink-0"
        title="Tutup notifikasi"
      >
        ✕
      </button>
    </div>
  );
}
