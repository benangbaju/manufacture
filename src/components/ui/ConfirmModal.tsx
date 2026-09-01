'use client';

import React from 'react';
import BaseModal from './BaseModal';
import { CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  lines: string[];
  onClose: () => void;
}

export default function ConfirmModal({ isOpen, title, lines, onClose }: ConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <h3 className="text-base font-bold text-[#e2e6ed] tracking-tight">{title}</h3>
          <p className="text-[0.7rem] text-[#5a6270]">Sistem telah mencatat mutasi data</p>
        </div>
      }
      icon={CheckCircle2}
      iconColor="text-[#6ea87a]"
      iconBg="bg-[#1a2a20]"
      iconBorder="border-[#2a3a30]"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="bg-[#0c0f17] border border-[#1e2330] rounded-xl p-3.5 space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="text-[#b0b8c4] text-xs flex items-start gap-2">
              <span className="text-[#6ea87a] font-bold mt-0.5">•</span>
              <span className="leading-relaxed">{line}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-[0.99] cursor-pointer"
        >
          OK, Selesai
        </button>
      </div>
    </BaseModal>
  );
}
