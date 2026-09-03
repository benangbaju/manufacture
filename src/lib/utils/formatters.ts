/**
 * Centralized formatting utilities for currency, numbers, and compact displays.
 */

/**
 * Format a number to standard Indonesian Rupiah format (e.g. "Rp 1.500.000")
 */
export function formatRupiah(val: number | null | undefined): string {
  const num = Number(val || 0);
  if (num < 0) {
    return `-Rp ${Math.abs(num).toLocaleString('id-ID')}`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * Format a number into a clean compact abbreviation (e.g. "Rp 1.5 Juta", "Rp 50k", "-Rp 1.5 Juta")
 */
export function formatCompactRupiah(val: number | null | undefined): string {
  const num = Number(val || 0);
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const prefix = isNeg ? '-Rp ' : 'Rp ';

  if (abs >= 1_000_000) {
    return `${prefix}${(abs / 1_000_000).toFixed(1)} Juta`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(abs / 1_000).toFixed(0)}k`;
  }
  return formatRupiah(num);
}

/**
 * Format compact number with k/jt suffix without "Rp" prefix (e.g. "1.5jt", "50k", "-1.5 jt")
 */
export function formatCompactNumber(val: number | null | undefined): string {
  const num = Number(val || 0);
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const prefix = isNeg ? '-' : '';

  if (abs >= 1_000_000) {
    return `${prefix}${(abs / 1_000_000).toFixed(1)} jt`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(abs / 1_000).toFixed(0)}k`;
  }
  return num.toLocaleString('id-ID');
}

/**
 * Format standard number with optional decimals and locale separation
 */
export function formatNumber(val: number | null | undefined, decimals?: number): string {
  const num = Number(val || 0);
  if (decimals !== undefined) {
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return num.toLocaleString('id-ID');
}
