/**
 * Centralized date helpers and range filtering for financial & manufacturing reports.
 */

export type DateFilterOption = 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'CUSTOM';

/**
 * Returns today's ISO date string in YYYY-MM-DD format (local timezone aligned)
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filters an array of objects based on a date field and the selected DateFilterOption
 */
export function filterByDateRange<T>(
  items: T[],
  dateKey: keyof T,
  filter: DateFilterOption,
  customStart?: string,
  customEnd?: string
): T[] {
  if (filter === 'ALL') return items;

  const todayStr = getTodayDateString();
  const today = new Date();

  return items.filter((item) => {
    const rawDate = item[dateKey];
    if (!rawDate || typeof rawDate !== 'string') return false;

    // Normalize date string (support both "YYYY-MM-DD" and ISO timestamps)
    const itemDateStr = rawDate.split('T')[0];

    if (filter === 'TODAY') {
      return itemDateStr === todayStr;
    }

    if (filter === '7_DAYS') {
      const itemDate = new Date(itemDateStr);
      const diffTime = today.getTime() - itemDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }

    if (filter === '30_DAYS') {
      const itemDate = new Date(itemDateStr);
      const diffTime = today.getTime() - itemDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }

    if (filter === 'THIS_MONTH') {
      return (
        itemDateStr.substring(0, 7) ===
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      );
    }

    if (filter === 'CUSTOM') {
      if (customStart && itemDateStr < customStart) return false;
      if (customEnd && itemDateStr > customEnd) return false;
      return true;
    }

    return true;
  });
}
