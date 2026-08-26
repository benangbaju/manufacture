import ExcelJS from 'exceljs';

export interface ProductionBatchReportItem {
  date: string;
  article: string;
  variant: string;
  qtyGood: number;
  qtyReject: number;
  totalCut: number;
  fabricUsed: number;
  yieldRate: number;
  rejectRatePct: number;
}

export interface SalesChannelReportItem {
  channel: string;
  regularQty: number;
  rejectQty: number;
  totalQty: number;
  regularRevenue: number;
  rejectRevenue: number;
  totalRevenue: number;
}

export interface RejectInventoryReportItem {
  article: string;
  variant: string;
  readyStock: number;
  rejectStock: number;
}

export interface ReportData {
  month: string;
  revenue: number;
  regularRevenue: number;
  rejectRevenue: number;
  regularQtySold: number;
  rejectQtySold: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  salesByChannel: SalesChannelReportItem[];
  productionBatches: ProductionBatchReportItem[];
  purchases: { date: string; material: string; qty: number; unit: string; totalCost: number }[];
  expenseList: { date: string; category: string; amount: number; notes: string }[];
  rejectInventorySummary?: RejectInventoryReportItem[];
}

export async function generateExcelReport(data: ReportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manufaktur & Cashflow App';
  workbook.created = new Date();

  // 1. SHEET RINGKASAN P&L (LABA RUGI DENGAN PEMISAHAN REJECT)
  const summarySheet = workbook.addWorksheet('Laporan Laba Rugi');
  summarySheet.columns = [
    { header: 'Keterangan', key: 'item', width: 45 },
    { header: 'Jumlah (Rp)', key: 'amount', width: 25 },
    { header: 'Catatan Akuntansi', key: 'notes', width: 35 },
  ];

  // Header styling
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

  summarySheet.addRows([
    { item: `LAPORAN KEUANGAN & MANUFAKTUR - ${data.month.toUpperCase()}`, amount: '', notes: '' },
    { item: 'Total Pendapatan (Total Revenue)', amount: data.revenue, notes: 'Semua penjualan (Reguler + Reject)' },
    { item: '  • Penjualan Reguler (Grade A / Barang Bagus)', amount: data.regularRevenue, notes: `${data.regularQtySold} pcs terjual normal` },
    { item: '  • Penjualan Cuci Gudang (Barang Reject / Afkir)', amount: data.rejectRevenue, notes: `${data.rejectQtySold} pcs obral/clearance` },
    { item: 'Harga Pokok Penjualan (HPP / COGS)', amount: data.cogs, notes: 'Menyerap biaya potong & bahan reject' },
    { item: 'Laba Kotor (Gross Profit)', amount: data.grossProfit, notes: 'Revenue - HPP' },
    { item: 'Total Pengeluaran Operasional', amount: data.expenses, notes: 'Ads, gaji, listrik, sewa workshop' },
    { item: 'Laba Bersih (Net Profit)', amount: data.netProfit, notes: 'Gross Profit - Operasional' },
  ]);

  // Format currency
  [3, 4, 5, 6, 7, 8, 9].forEach(rowNum => {
    const row = summarySheet.getRow(rowNum);
    row.getCell(2).numFmt = '"Rp" #,##0';
    if (rowNum === 3 || rowNum === 7 || rowNum === 9) {
      row.font = { bold: true };
    }
  });

  // 2. SHEET PENJUALAN PER CHANNEL (TERSEMENTASI GRADE A VS REJECT)
  const salesSheet = workbook.addWorksheet('Penjualan');
  salesSheet.columns = [
    { header: 'Channel Penjualan', key: 'channel', width: 22 },
    { header: 'Qty Grade A (Pcs)', key: 'regularQty', width: 18 },
    { header: 'Qty Reject (Pcs)', key: 'rejectQty', width: 16 },
    { header: 'Total Qty (Pcs)', key: 'totalQty', width: 16 },
    { header: 'Omset Reguler (Rp)', key: 'regularRevenue', width: 22 },
    { header: 'Omset Reject (Rp)', key: 'rejectRevenue', width: 20 },
    { header: 'Total Omset (Rp)', key: 'totalRevenue', width: 24 },
  ];
  salesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  salesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

  data.salesByChannel.forEach(s => {
    const row = salesSheet.addRow(s);
    row.getCell(5).numFmt = '"Rp" #,##0';
    row.getCell(6).numFmt = '"Rp" #,##0';
    row.getCell(7).numFmt = '"Rp" #,##0';
  });

  // 3. SHEET PRODUKSI DENGAN KONTROL KUALITAS & REJECT RATE
  const prodSheet = workbook.addWorksheet('Riwayat Produksi');
  prodSheet.columns = [
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Artikel', key: 'article', width: 25 },
    { header: 'Warna Varian', key: 'variant', width: 18 },
    { header: 'Qty Bagus / Grade A', key: 'qtyGood', width: 20 },
    { header: 'Qty Reject / Afkir', key: 'qtyReject', width: 18 },
    { header: 'Total Potong (Pcs)', key: 'totalCut', width: 18 },
    { header: 'Reject Rate (%)', key: 'rejectRatePct', width: 16 },
    { header: 'Kain Terpakai (Meter)', key: 'fabricUsed', width: 22 },
    { header: 'Yield (Pcs/Meter)', key: 'yieldRate', width: 18 },
  ];
  prodSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  prodSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };

  data.productionBatches.forEach(p => {
    const row = prodSheet.addRow(p);
    row.getCell(7).numFmt = '0.0"%"';
    row.getCell(9).numFmt = '0.0';
  });

  // 4. SHEET PEMBELIAN
  const purchaseSheet = workbook.addWorksheet('Pembelian Bahan');
  purchaseSheet.columns = [
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Nama Bahan / Kain', key: 'material', width: 25 },
    { header: 'Jumlah', key: 'qty', width: 15 },
    { header: 'Satuan', key: 'unit', width: 12 },
    { header: 'Total Biaya (Rp)', key: 'totalCost', width: 22 },
  ];
  purchaseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  purchaseSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };

  data.purchases.forEach(pu => {
    const row = purchaseSheet.addRow(pu);
    row.getCell(5).numFmt = '"Rp" #,##0';
  });

  // 5. SHEET PENGELUARAN OPERASIONAL
  const expSheet = workbook.addWorksheet('Pengeluaran Operasional');
  expSheet.columns = [
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Kategori', key: 'category', width: 22 },
    { header: 'Jumlah (Rp)', key: 'amount', width: 20 },
    { header: 'Keterangan', key: 'notes', width: 35 },
  ];
  expSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  expSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };

  data.expenseList.forEach(e => {
    const row = expSheet.addRow(e);
    row.getCell(3).numFmt = '"Rp" #,##0';
  });

  // 6. SHEET INVENTORI REJECT & SIAP JUAL (OPSIONAL)
  if (data.rejectInventorySummary && data.rejectInventorySummary.length > 0) {
    const invSheet = workbook.addWorksheet('Inventori Terpisah');
    invSheet.columns = [
      { header: 'Artikel', key: 'article', width: 25 },
      { header: 'Warna Varian', key: 'variant', width: 18 },
      { header: 'Stok Siap Jual (Grade A)', key: 'readyStock', width: 24 },
      { header: 'Stok Reject (Afkir)', key: 'rejectStock', width: 20 },
    ];
    invSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    invSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };

    data.rejectInventorySummary.forEach(inv => {
      invSheet.addRow(inv);
    });
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Laporan_Manufaktur_${data.month.replace(' ', '_')}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
