'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiStatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  badge?: React.ReactNode;
  iconBg?: string;
  iconBorder?: string;
  iconColor?: string;
}

export default function KpiStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  iconBg = 'bg-[#1a2030]',
  iconBorder = 'border-[#2a3040]',
  iconColor = 'text-[#7eb3db]',
}: KpiStatCardProps) {
  return (
    <div className="glass-card p-4 rounded-2xl flex items-center justify-between border">
      <div className="space-y-1 min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block truncate">
            {title}
          </span>
          {badge}
        </div>
        <div className="text-xl sm:text-2xl font-black text-[#e2e6ed] tracking-tight font-mono truncate">
          {value}
        </div>
        {subtitle && (
          <div className="text-[0.7rem] text-[#5a6270] truncate">
            {subtitle}
          </div>
        )}
      </div>
      <div
        className={`w-11 h-11 rounded-2xl ${iconBg} border ${iconBorder} flex items-center justify-center ${iconColor} shrink-0 shadow-sm`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
