'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50]
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="p-3 bg-[#0a0d14] border-t border-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8899aa]">
      {/* Left: Summary and Page Size */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <span>
          Menampilkan <strong className="text-[#e2e6ed] font-mono">{startItem}-{endItem}</strong> dari <strong className="text-[#e2e6ed] font-mono">{totalItems}</strong> data
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-[#1e2330]">
            <span className="text-[0.7rem] text-[#5a6270]">Baris:</span>
            <select
              value={pageSize}
              onChange={e => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 bg-[#121620] border border-[#2a3040] rounded-lg text-xs font-semibold text-[#e2e6ed] focus:border-[#7eb3db] outline-none cursor-pointer"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center sm:justify-end gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg bg-[#121620] hover:bg-[#1a2030] text-[#8899aa] hover:text-[#e2e6ed] border border-[#1e2330] disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-[#5a6270] font-mono">
                  ...
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
                  isCurrent
                    ? 'bg-[#3d5a80] text-white shadow-sm'
                    : 'bg-[#121620] hover:bg-[#1a2030] text-[#8899aa] hover:text-[#e2e6ed] border border-[#1e2330]'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg bg-[#121620] hover:bg-[#1a2030] text-[#8899aa] hover:text-[#e2e6ed] border border-[#1e2330] disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
