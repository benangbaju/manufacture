import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ==========================================
// 1. MASTER ARTIKEL & VARIAN
// ==========================================
export async function getDbArticles() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('articles')
    .select('*, product_variants(*)')
    .order('id');
  if (error) throw error;
  return (data || []).map((a: any) => ({
    ...a,
    variants: a.product_variants || a.variants || [],
    product_variants: a.product_variants || a.variants || [],
  }));
}

export async function getDbArticleDetail(id: number) {
  if (!isSupabaseConfigured()) return null;
  const { data: article, error: artErr } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (artErr) throw artErr;

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*, variant_fabric_mapping(fabric_stock(*))')
    .eq('article_id', id)
    .order('id');

  const { data: recipes } = await supabase
    .from('product_recipes')
    .select('*, raw_materials(*)')
    .eq('article_id', id);

  return {
    ...article,
    variants: variants || [],
    recipes: recipes || [],
  };
}

export async function createDbArticle(name: string, description: string, colors: string[]) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data: article, error: artErr } = await supabase
    .from('articles')
    .insert({ name, description })
    .select()
    .single();
  if (artErr) throw artErr;

  if (colors.length > 0) {
    const variantRows = colors.map(c => ({
      article_id: article.id,
      color: c.trim(),
      stock_qty: 0,
      stock_reject_qty: 0,
    }));
    const { error: varErr } = await supabase.from('product_variants').insert(variantRows);
    if (varErr) throw varErr;
  }

  return article;
}

export async function updateDbArticle(id: number, name: string, description: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('articles')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbArticle(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 2. VARIAN PRODUK
// ==========================================
export async function createDbVariant(articleId: number, color: string, stockQty = 0, stockRejectQty = 0) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('product_variants')
    .insert({ article_id: articleId, color, stock_qty: stockQty, stock_reject_qty: stockRejectQty })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDbVariant(id: number, color: string, stockQty: number, stockRejectQty: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('product_variants')
    .update({ color, stock_qty: stockQty, stock_reject_qty: stockRejectQty })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbVariant(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 3. STOK KAIN & BAHAN BAKU
// ==========================================
export async function getDbFabricStock() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('fabric_stock').select('*').order('id');
  if (error) throw error;
  return data || [];
}

export async function createDbFabric(name: string, unit = 'meter', stockQty = 0) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('fabric_stock')
    .insert({ name, unit, stock_qty: stockQty })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDbFabric(id: number, name: string, unit: string, stockQty: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('fabric_stock')
    .update({ name, unit, stock_qty: stockQty })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbFabric(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('fabric_stock').delete().eq('id', id);
  if (error) throw error;
}

export async function getDbRawMaterials() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('raw_materials').select('*').order('id');
  if (error) throw error;
  return data || [];
}

export async function createDbRawMaterial(name: string, unit = 'pcs', stockQty = 0) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('raw_materials')
    .insert({ name, unit, stock_qty: stockQty })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDbRawMaterial(id: number, name: string, unit: string, stockQty: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('raw_materials')
    .update({ name, unit, stock_qty: stockQty })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbRawMaterial(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('raw_materials').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 4. RESEP (BOM) & PEMETAAN KAIN
// ==========================================
export async function getDbRecipes() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('product_recipes')
    .select('*, articles(name), raw_materials(id, name, unit, stock_qty)')
    .order('id');
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id,
    article_id: r.article_id,
    raw_material_id: r.raw_material_id,
    qty_per_piece: Number(r.qty_per_unit),
    raw_materials: r.raw_materials,
    articles: r.articles,
  }));
}

export async function saveDbRecipe(articleId: number, rawMaterialId: number, qtyPerUnit: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('product_recipes')
    .upsert({ article_id: articleId, raw_material_id: rawMaterialId, qty_per_unit: qtyPerUnit }, { onConflict: 'article_id,raw_material_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbRecipe(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('product_recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function getDbFabricMappings() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('variant_fabric_mapping')
    .select('*, product_variants(id, color, article_id, articles(name)), fabric_stock(id, name, unit, stock_qty)')
    .order('id');
  if (error) throw error;
  return (data || []).map(m => ({
    id: m.id,
    article_id: m.product_variants?.article_id,
    variant_id: m.variant_id,
    variant_color: m.product_variants?.color || '',
    fabric_stock_id: m.fabric_stock_id,
    articles: m.product_variants?.articles,
    fabric_stock: m.fabric_stock,
  }));
}

export async function saveDbFabricMapping(
  articleIdOrVariantId: number,
  colorOrFabricStockId: string | number,
  fabricStockIdParam?: number
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');

  let finalVariantId = articleIdOrVariantId;
  let finalFabricStockId = typeof colorOrFabricStockId === 'number' ? colorOrFabricStockId : (fabricStockIdParam || 0);

  if (typeof colorOrFabricStockId === 'string') {
    const articleId = articleIdOrVariantId;
    const color = colorOrFabricStockId.trim();

    // Check if variant exists or create it
    const { data: existingVariant } = await supabase
      .from('product_variants')
      .select('id')
      .eq('article_id', articleId)
      .ilike('color', color)
      .maybeSingle();

    if (existingVariant) {
      finalVariantId = existingVariant.id;
    } else {
      const { data: newV, error: vErr } = await supabase
        .from('product_variants')
        .insert({ article_id: articleId, color, stock_qty: 0, stock_reject_qty: 0 })
        .select('id')
        .single();
      if (vErr) throw vErr;
      finalVariantId = newV.id;
    }
  }

  const { data, error } = await supabase
    .from('variant_fabric_mapping')
    .upsert({ variant_id: finalVariantId, fabric_stock_id: finalFabricStockId, is_primary: true }, { onConflict: 'variant_id,fabric_stock_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbFabricMapping(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('variant_fabric_mapping').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 5. SALES CHANNELS
// ==========================================
export async function getDbChannels() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('sales_channels').select('*').order('id');
  if (error) throw error;
  return data || [];
}

export async function createDbChannel(name: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase.from('sales_channels').insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDbChannel(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('sales_channels').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 6. PEMBELIAN BAHAN (PURCHASES)
// ==========================================
export async function getDbPurchases() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('purchases')
    .select('*, raw_materials(name, unit), fabric_stock(name, unit)')
    .order('purchase_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    item_type: p.item_type,
    raw_material_id: p.raw_material_id,
    fabric_stock_id: p.fabric_stock_id,
    material_name: p.item_type === 'fabric' ? (p.fabric_stock?.name || 'Kain') : (p.raw_materials?.name || 'Bahan Baku'),
    qty: Number(p.qty),
    unit: p.item_type === 'fabric' ? (p.fabric_stock?.unit || 'meter') : (p.raw_materials?.unit || 'pcs'),
    unit_price: Number(p.unit_price),
    total_price: Number(p.qty) * Number(p.unit_price),
    supplier: p.supplier,
    purchase_date: p.purchase_date,
    raw_materials: p.raw_materials,
    fabric_stock: p.fabric_stock,
  }));
}

export async function createDbPurchase(item: {
  item_type: 'raw_material' | 'fabric';
  raw_material_id?: number | null;
  fabric_stock_id?: number | null;
  qty: number;
  unit_price: number;
  supplier?: string;
  purchase_date: string;
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase.from('purchases').insert(item).select().single();
  if (error) throw error;

  // Update physical stock
  if (item.item_type === 'fabric' && item.fabric_stock_id) {
    const { data: fs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', item.fabric_stock_id).single();
    if (fs) {
      await supabase.from('fabric_stock').update({ stock_qty: Number(fs.stock_qty) + item.qty }).eq('id', item.fabric_stock_id);
    }
  } else if (item.item_type === 'raw_material' && item.raw_material_id) {
    const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', item.raw_material_id).single();
    if (rm) {
      await supabase.from('raw_materials').update({ stock_qty: Number(rm.stock_qty) + item.qty }).eq('id', item.raw_material_id);
    }
  }

  return data;
}

export async function deleteDbPurchase(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 7. PRODUKSI (PRODUCTION BATCHES)
// ==========================================
export async function getDbProductionBatches() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('production_batches')
    .select('*, product_variants(id, color, article_id, stock_qty, stock_reject_qty, articles(name)), fabric_stock(name, unit), production_costs(*)')
    .order('production_date', { ascending: false });
  if (error) throw error;

  return (data || []).map(b => {
    const totalCut = Number(b.qty_produced || 0) + Number(b.qty_reject || 0);
    const fabricMtr = Number(b.fabric_used || 0);
    const yieldRatio = totalCut > 0 && fabricMtr > 0 ? Number((totalCut / fabricMtr).toFixed(1)) : 0;
    const laborCost = b.production_costs?.find((c: any) => c.cost_type === 'tenaga_kerja')?.amount || 0;
    const costPerPcs = totalCut > 0 ? Math.round(Number(laborCost) / totalCut) : 8000;
    const isPaid = !b.notes?.includes('[BELUM_DIBAYAR]');

    return {
      id: b.id,
      batch_date: b.production_date,
      article_id: b.product_variants?.article_id,
      variant_id: b.variant_id,
      fabric_stock_id: b.fabric_stock_id,
      qty_produced: Number(b.qty_produced || 0),
      qty_reject: Number(b.qty_reject || 0),
      fabric_used: fabricMtr,
      yield_ratio: yieldRatio,
      cost_per_pcs: costPerPcs,
      total_sewing_cost: Number(laborCost),
      is_paid: isPaid,
      articles: b.product_variants?.articles,
      variants: b.product_variants,
      fabric_stock: b.fabric_stock,
    };
  });
}

export async function createDbProductionBatch(batch: {
  variant_id: number;
  qty_produced: number;
  qty_reject: number;
  fabric_stock_id?: number | null;
  fabric_used: number;
  cost_per_pcs?: number;
  total_sewing_cost?: number;
  is_paid?: boolean;
  production_date?: string;
  batch_date?: string;
  yield_ratio?: number;
  article_id?: number;
  paid_date?: string;
  notes?: string;
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const totalCut = batch.qty_produced + batch.qty_reject;
  const costPcs = batch.cost_per_pcs ?? 8000;
  const totalLaborCost = batch.total_sewing_cost ?? (totalCut * costPcs);
  const prodDate = batch.production_date || batch.batch_date || new Date().toISOString().split('T')[0];
  const paidTag = batch.is_paid ? '[SUDAH_DIBAYAR]' : '[BELUM_DIBAYAR]';
  const finalNotes = `${paidTag} ${batch.notes || ''}`.trim();

  // Insert batch
  const { data: newBatch, error: batchErr } = await supabase
    .from('production_batches')
    .insert({
      variant_id: batch.variant_id,
      qty_produced: batch.qty_produced,
      qty_reject: batch.qty_reject,
      fabric_stock_id: batch.fabric_stock_id,
      fabric_used: batch.fabric_used,
      production_date: prodDate,
      notes: finalNotes,
    })
    .select()
    .single();
  if (batchErr) throw batchErr;

  // Insert labor cost
  if (totalLaborCost > 0) {
    await supabase.from('production_costs').insert({
      batch_id: newBatch.id,
      cost_type: 'tenaga_kerja',
      amount: totalLaborCost,
    });
  }

  // Update variant stock (finished stock + Grade A, reject stock + Reject)
  const { data: pv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', batch.variant_id).single();
  if (pv) {
    await supabase.from('product_variants').update({
      stock_qty: Number(pv.stock_qty || 0) + batch.qty_produced,
      stock_reject_qty: Number(pv.stock_reject_qty || 0) + batch.qty_reject,
    }).eq('id', batch.variant_id);
  }

  // Deduct fabric stock
  if (batch.fabric_stock_id && batch.fabric_used > 0) {
    const { data: fs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', batch.fabric_stock_id).single();
    if (fs) {
      await supabase.from('fabric_stock').update({
        stock_qty: Math.max(0, Number(fs.stock_qty) - batch.fabric_used),
      }).eq('id', batch.fabric_stock_id);
    }
  }

  return newBatch;
}

export async function toggleDbBatchPaid(id: number, currentPaid?: boolean) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data: b } = await supabase.from('production_batches').select('notes').eq('id', id).single();
  const nextPaid = !currentPaid;
  let notes = b?.notes || '';
  notes = notes.replace('[SUDAH_DIBAYAR]', '').replace('[BELUM_DIBAYAR]', '').trim();
  const updatedNotes = `${nextPaid ? '[SUDAH_DIBAYAR]' : '[BELUM_DIBAYAR]'} ${notes}`.trim();

  const { data, error } = await supabase
    .from('production_batches')
    .update({ notes: updatedNotes })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDbProductionBatch(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('production_batches').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 8. PENJUALAN (SALES)
// ==========================================
export async function getDbSales() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('sales')
    .select('*, product_variants(id, color, article_id, stock_qty, stock_reject_qty, articles(name)), sales_channels(name)')
    .order('sale_date', { ascending: false });
  if (error) throw error;

  return (data || []).map(s => ({
    id: s.id,
    sale_date: s.sale_date,
    article_id: s.product_variants?.article_id,
    variant_id: s.variant_id,
    channel_id: s.channel_id,
    item_grade: s.item_grade as 'grade_a' | 'reject',
    qty: Number(s.qty),
    unit_price: Number(s.sale_price),
    total_price: Number(s.qty) * Number(s.sale_price),
    articles: s.product_variants?.articles,
    variants: s.product_variants,
    channels: s.sales_channels,
  }));
}

export async function createDbSale(sale: {
  variant_id: number;
  channel_id: number;
  item_grade: 'grade_a' | 'reject';
  qty: number;
  sale_price?: number;
  total_price?: number;
  sale_date: string;
  article_id?: number;
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const price = sale.sale_price ?? (sale.total_price ? Math.round(sale.total_price / sale.qty) : 0);

  const { data: newSale, error } = await supabase
    .from('sales')
    .insert({
      variant_id: sale.variant_id,
      channel_id: sale.channel_id,
      item_grade: sale.item_grade,
      qty: sale.qty,
      sale_price: price,
      sale_date: sale.sale_date,
    })
    .select()
    .single();
  if (error) throw error;

  // Deduct stock according to grade
  const { data: pv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', sale.variant_id).single();
  if (pv) {
    if (sale.item_grade === 'grade_a') {
      await supabase.from('product_variants').update({
        stock_qty: Math.max(0, Number(pv.stock_qty || 0) - sale.qty),
      }).eq('id', sale.variant_id);
    } else {
      await supabase.from('product_variants').update({
        stock_reject_qty: Math.max(0, Number(pv.stock_reject_qty || 0) - sale.qty),
      }).eq('id', sale.variant_id);
    }
  }

  return newSale;
}


export async function deleteDbSale(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 9. PENGELUARAN OPERASIONAL (EXPENSES)
// ==========================================
export async function getDbExpenses() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createDbExpense(expense: {
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase.from('expenses').insert(expense).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDbExpense(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 10. DASHBOARD SUMMARY & LIVE METRICS
// ==========================================
export async function getDbDashboardSummary() {
  if (!isSupabaseConfigured()) return null;

  try {
    const [cashRes, articlesRes, fabricRes, salesRes, batchRes] = await Promise.all([
      supabase.from('v_current_cash_balance').select('*').single(),
      supabase.from('product_variants').select('stock_qty, stock_reject_qty'),
      supabase.from('fabric_stock').select('stock_qty'),
      supabase.from('sales').select('qty, sale_price, item_grade, sale_date'),
      supabase.from('production_batches').select('qty_produced, qty_reject, fabric_used, production_date'),
    ]);

    const totalFinishedStock = articlesRes.data?.reduce((acc, curr) => acc + (curr.stock_qty || 0), 0) || 0;
    const totalRejectStock = articlesRes.data?.reduce((acc, curr) => acc + (curr.stock_reject_qty || 0), 0) || 0;
    const totalFabricStock = fabricRes.data?.reduce((acc, curr) => acc + Number(curr.stock_qty || 0), 0) || 0;

    const totalSalesRevenue = salesRes.data?.reduce((acc, curr) => acc + (curr.qty * curr.sale_price), 0) || 0;
    const regularSalesRevenue = salesRes.data?.filter(s => s.item_grade === 'grade_a').reduce((acc, curr) => acc + (curr.qty * curr.sale_price), 0) || 0;
    const rejectSalesRevenue = salesRes.data?.filter(s => s.item_grade === 'reject').reduce((acc, curr) => acc + (curr.qty * curr.sale_price), 0) || 0;

    return {
      cashBalance: cashRes.data?.current_cash_balance || 0,
      totalRevenue: totalSalesRevenue,
      regularRevenue: regularSalesRevenue,
      rejectRevenue: rejectSalesRevenue,
      totalFinishedStock,
      totalRejectStock,
      totalFabricStock,
      totalSKUCount: articlesRes.data?.length || 0,
      totalBatchesCount: batchRes.data?.length || 0,
    };
  } catch {
    return null;
  }
}

