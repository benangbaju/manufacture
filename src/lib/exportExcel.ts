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
  fabricCost?: number;
  laborCost?: number;
  accessoriesCost?: number;
  totalCost?: number;
  unitCost?: number;
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
  regularCogs?: number;
  rejectCogs?: number;
  regularGrossProfit?: number;
  rejectGrossProfit?: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  totalMaterialPurchased?: number;
  totalSewingPaid?: number;
  avgHppPerUnit?: number;
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

  // 1. SHEET RINGKASAN P&L (LABA RUGI DENGAN PEMISAHAN REJECT & HPP RIIL)
  const summarySheet = workbook.addWorksheet('Laporan Laba Rugi');
  summarySheet.columns = [
    { header: 'Keterangan', key: 'item', width: 48 },
    { header: 'Jumlah (Rp)', key: 'amount', width: 25 },
    { header: 'Catatan Akuntansi & Unit Cost', key: 'notes', width: 45 },
  ];

  // Header styling
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

  summarySheet.addRows([
    { item: `LAPORAN KEUANGAN & MANUFAKTUR - ${data.month.toUpperCase()}`, amount: '', notes: '' },
    { item: 'A. PENDAPATAN PENJUALAN (REVENUE)', amount: data.revenue, notes: 'Total omset penjualan kotor' },
    { item: '  • Penjualan Reguler (Grade A / Barang Bagus)', amount: data.regularRevenue, notes: `${data.regularQtySold} pcs terjual normal` },
    { item: '  • Penjualan Cuci Gudang (Barang Reject / Afkir)', amount: data.rejectRevenue, notes: `${data.rejectQtySold} pcs obral/clearance` },
    { item: 'B. HARGA POKOK PENJUALAN (HPP / COGS)', amount: data.cogs, notes: 'Beban pokok barang terjual (Unit Cost Based)' },
    { item: '  • HPP Barang Reguler (Grade A)', amount: data.regularCogs || 0, notes: `Beban pokok untuk ${data.regularQtySold} pcs Grade A` },
    { item: '  • HPP Barang Reject (Afkir)', amount: data.rejectCogs || 0, notes: `Beban pokok untuk ${data.rejectQtySold} pcs Reject` },
    { item: 'C. LABA KOTOR (GROSS PROFIT)', amount: data.grossProfit, notes: 'Revenue - HPP' },
    { item: '  • Margin Laba Kotor Grade A', amount: data.regularGrossProfit || (data.regularRevenue - (data.regularCogs || 0)), notes: 'Laba kotor dari produk Grade A' },
    { item: '  • Margin Laba Kotor Reject', amount: data.rejectGrossProfit || (data.rejectRevenue - (data.rejectCogs || 0)), notes: 'Laba kotor (atau selisih) penjualan reject' },
    { item: 'D. TOTAL BEBAN OPERASIONAL (OPEX)', amount: data.expenses, notes: 'Ads, gaji, listrik, sewa workshop, dll' },
    { item: 'E. LABA BERSIH (NET PROFIT)', amount: data.netProfit, notes: 'Gross Profit - Beban Operasional' },
    { item: '', amount: '', notes: '' },
    { item: '--- INFORMASI ARUS KAS KELUAR BULAN INI ---', amount: '', notes: 'Uang keluar riil (Cash Outflow)' },
    { item: '  • Pembelian Bahan Baku (Kain & Aksesoris)', amount: data.totalMaterialPurchased || 0, notes: 'Pengeluaran uang untuk stok bahan' },
    { item: '  • Total Ongkos Jahit & Potong Batch', amount: data.totalSewingPaid || 0, notes: 'Biaya tenaga kerja produksi batch' },
  ]);

  // Format currency on summary rows
  [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17].forEach(rowNum => {
    const row = summarySheet.getRow(rowNum);
    row.getCell(2).numFmt = '"Rp" #,##0';
    if ([3, 6, 9, 12, 13, 15].includes(rowNum)) {
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

  // 3. SHEET PRODUKSI DENGAN KONTROL KUALITAS & HPP PER PCS
  const prodSheet = workbook.addWorksheet('Riwayat Produksi');
  prodSheet.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Artikel', key: 'article', width: 22 },
    { header: 'Warna Varian', key: 'variant', width: 16 },
    { header: 'Qty Bagus', key: 'qtyGood', width: 14 },
    { header: 'Qty Reject', key: 'qtyReject', width: 14 },
    { header: 'Total Potong', key: 'totalCut', width: 15 },
    { header: 'Reject Rate (%)', key: 'rejectRatePct', width: 16 },
    { header: 'Kain (Mtr)', key: 'fabricUsed', width: 14 },
    { header: 'Yield (Pcs/Mtr)', key: 'yieldRate', width: 16 },
    { header: 'Biaya Kain (Rp)', key: 'fabricCost', width: 18 },
    { header: 'Ongkos Jahit (Rp)', key: 'laborCost', width: 18 },
    { header: 'Total Biaya (Rp)', key: 'totalCost', width: 20 },
    { header: 'HPP / Pcs (Rp)', key: 'unitCost', width: 18 },
  ];
  prodSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  prodSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };

  data.productionBatches.forEach(p => {
    const row = prodSheet.addRow(p);
    row.getCell(7).numFmt = '0.0"%"';
    row.getCell(9).numFmt = '0.0';
    row.getCell(10).numFmt = '"Rp" #,##0';
    row.getCell(11).numFmt = '"Rp" #,##0';
    row.getCell(12).numFmt = '"Rp" #,##0';
    row.getCell(13).numFmt = '"Rp" #,##0';
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

export interface RecipeExportItem {
  articleName: string;
  variantColor: string;
  materialName: string;
  qty: number;
  unit: string;
}

export async function exportRecipesToExcel(items: RecipeExportItem[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manufaktur & Cashflow App';
  workbook.created = new Date();

  // SHEET 1: DETAIL FORMULASI BOM
  const sheet = workbook.addWorksheet('Detail Resep BOM');
  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Model / Artikel Produk', key: 'articleName', width: 32 },
    { header: 'Varian Warna', key: 'variantColor', width: 22 },
    { header: 'Bahan Baku / Aksesoris (BOM)', key: 'materialName', width: 36 },
    { header: 'Takaran (per pcs)', key: 'qty', width: 20 },
    { header: 'Satuan', key: 'unit', width: 14 },
  ];

  // Header Styling
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  items.forEach((item, idx) => {
    const row = sheet.addRow({
      no: idx + 1,
      articleName: item.articleName,
      variantColor: item.variantColor,
      materialName: item.materialName,
      qty: item.qty,
      unit: item.unit,
    });
    row.height = 20;
    row.alignment = { vertical: 'middle' };
    row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('qty').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('unit').alignment = { vertical: 'middle', horizontal: 'center' };

    // Zebra striping
    if (idx % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  // SHEET 2: RINGKASAN RESEP PER VARIAN
  const summarySheet = workbook.addWorksheet('Ringkasan per SKU Varian');
  summarySheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Model / Artikel', key: 'articleName', width: 30 },
    { header: 'Varian Warna', key: 'variantColor', width: 20 },
    { header: 'Jumlah Komponen', key: 'componentCount', width: 18 },
    { header: 'Daftar Formulasi Komponen & Takaran', key: 'components', width: 65 },
  ];

  const sumHeaderRow = summarySheet.getRow(1);
  sumHeaderRow.height = 28;
  sumHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  sumHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  sumHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Group items by Article + Variant
  const grouped = new Map<string, { articleName: string; variantColor: string; parts: string[]; count: number }>();
  for (const item of items) {
    const key = `${item.articleName}:::${item.variantColor}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        articleName: item.articleName,
        variantColor: item.variantColor,
        parts: [],
        count: 0
      });
    }
    const entry = grouped.get(key)!;
    entry.count++;
    entry.parts.push(`${item.qty} ${item.unit} ${item.materialName}`);
  }

  let summaryIdx = 1;
  for (const entry of grouped.values()) {
    const row = summarySheet.addRow({
      no: summaryIdx++,
      articleName: entry.articleName,
      variantColor: entry.variantColor,
      componentCount: entry.count,
      components: entry.parts.join(' + '),
    });
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('componentCount').alignment = { vertical: 'middle', horizontal: 'center' };

    if (summaryIdx % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  // Trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Data_Resep_BOM_Produk_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

