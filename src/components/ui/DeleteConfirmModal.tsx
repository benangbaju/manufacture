'use client';

import React from 'react';
import BaseModal from './BaseModal';
import { Trash2 } from 'lucide-react';

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
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        <div>
          <h3 className="text-sm font-bold text-[#e2e6ed] tracking-tight">{title}</h3>
          <p className="text-[0.7rem] text-[#5a6270]">Tindakan ini tidak dapat dibatalkan</p>
        </div>
      }
      icon={Trash2}
      iconColor="text-[#b85c5c]"
      iconBg="bg-[#2a1a1a]"
      iconBorder="border-[#3a2828]"
      maxWidth="sm"
    >
      <div className="space-y-4">
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
            className="py-2.5 px-3 rounded-xl bg-[#1a2030] hover:bg-[#222a3a] text-[#8899aa] font-semibold text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#8c4040] hover:bg-[#a04848] text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
