'use client';

import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  lines: string[];
  onClose: () => void;
}

export default function ConfirmModal({ isOpen, title, lines, onClose }: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="bg-[#12161f] border border-[#2a3040] rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a2a20] border border-[#2a3a30] flex items-center justify-center text-[#6ea87a]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e2e6ed] tracking-tight">{title}</h3>
              <p className="text-[0.7rem] text-[#5a6270]">Sistem telah mencatat mutasi data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#0c0f17] border border-[#1e2330] rounded-xl p-3.5 mb-5 space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="text-[#b0b8c4] text-xs flex items-start gap-2">
              <span className="text-[#6ea87a] font-bold mt-0.5">•</span>
              <span className="leading-relaxed">{line}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-[0.99]"
        >
          OK, Selesai
        </button>
      </div>
    </div>
  );
}
