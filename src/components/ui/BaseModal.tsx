'use client';

import React, { useEffect } from 'react';
import { X, LucideIcon } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  iconBorder?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  children: React.ReactNode;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconColor = 'text-[#7eb3db]',
  iconBg,
  iconBorder,
  maxWidth = 'md',
  children,
}: BaseModalProps) {
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
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-[#121620] border border-[#2a3848] rounded-2xl w-full ${maxWidthMap[maxWidth]} p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2838]">
          <div className="flex items-center gap-3">
            {Icon && (
              iconBg ? (
                <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconBorder ? `border ${iconBorder}` : ''} flex items-center justify-center ${iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              ) : (
                <Icon className={`w-4 h-4 ${iconColor}`} />
              )
            )}
            {typeof title === 'string' ? (
              <h3 className="text-sm font-bold text-[#e2e6ed]">{title}</h3>
            ) : (
              title
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5a6270] hover:text-[#e2e6ed] p-1 rounded-lg hover:bg-[#1a2030] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
