/**
 * Centralized array sorting helper for master items and tables.
 */

export interface SortOptions<T> {
  getName?: (item: T) => string;
  getStock?: (item: T) => number;
  getId?: (item: T) => number;
  getDate?: (item: T) => string;
  getCustomString?: (item: T, key: string) => string;
  getCustomNumber?: (item: T, key: string) => number;
}

export function sortMasterItems<T>(
  items: T[],
  sortBy: string,
  options?: SortOptions<T>
): T[] {
  const copy = [...items];
  const getName = options?.getName || ((item: any) => item.name || '');
  const getStock = options?.getStock || ((item: any) => Number(item.stock_qty || item.stock || 0));
  const getId = options?.getId || ((item: any) => Number(item.id || 0));
  const getDate = options?.getDate || ((item: any) => item.created_at || item.date || '');

  switch (sortBy) {
    case 'name-asc':
      return copy.sort((a, b) => getName(a).localeCompare(getName(b), 'id'));
    case 'name-desc':
      return copy.sort((a, b) => getName(b).localeCompare(getName(a), 'id'));
    case 'stock-desc':
      return copy.sort((a, b) => getStock(b) - getStock(a));
    case 'stock-asc':
      return copy.sort((a, b) => getStock(a) - getStock(b));
    case 'newest':
      return copy.sort((a, b) => {
        const dA = getDate(a);
        const dB = getDate(b);
        if (dA && dB) return new Date(dB).getTime() - new Date(dA).getTime();
        return getId(b) - getId(a);
      });
    case 'oldest':
      return copy.sort((a, b) => {
        const dA = getDate(a);
        const dB = getDate(b);
        if (dA && dB) return new Date(dA).getTime() - new Date(dB).getTime();
        return getId(a) - getId(b);
      });
    default:
      return copy;
  }
}
