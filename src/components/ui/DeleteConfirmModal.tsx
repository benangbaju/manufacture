'use client';

import { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  message?: string;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title = 'Konfirmasi Hapus Data',
  itemName,
  message,
  details,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-[#12161f] border border-[#3a2828] rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in zoom-in-95 duration-150 space-y-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle warm glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#b85c5c]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a1a1a] border border-[#3a2828] flex items-center justify-center text-[#b85c5c] shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#e2e6ed] tracking-tight">{title}</h3>
              <p className="text-[0.7rem] text-[#5a6270]">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {(itemName || message) && (
          <div className="p-3 bg-[#0c0f17] border border-[#1e2330] rounded-xl space-y-1.5 text-xs text-[#b0b8c4]">
            {itemName && (
              <p className="font-semibold text-[#e2e6ed] truncate">
                {itemName}
              </p>
            )}
            {message && (
              <p className="text-[#aab8c8] text-xs leading-relaxed">
                {message}
              </p>
            )}
            {details && details.length > 0 && (
              <div className="pt-1.5 border-t border-[#1e2330] space-y-1 text-[0.7rem] text-[#5a6270]">
                {details.map((d, i) => (
                  <p key={i}>• {d}</p>
                ))}
              </div>
            )}
          </div>
        )}


        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#8c4040] hover:bg-[#a04848] text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
}
