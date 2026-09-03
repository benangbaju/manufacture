import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ==========================================
// 1. MASTER ARTIKEL & VARIAN
// ==========================================
export async function getDbArticles() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('articles')
    .select('*, product_variants(*)')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map((a: any) => {
    const rawVariants = a.product_variants || a.variants || [];
    const sortedVariants = rawVariants.slice().sort((v1: any, v2: any) =>
      (v1.color || '').localeCompare(v2.color || '', 'id', { sensitivity: 'base' })
    );
    return {
      ...a,
      variants: sortedVariants,
      product_variants: sortedVariants,
    };
  });
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
export async function createDbVariant(articleId: number, color: string, stockQty = 0, stockRejectQty = 0, initialHpp = 0) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('product_variants')
    .insert({ article_id: articleId, color, stock_qty: stockQty, stock_reject_qty: stockRejectQty, initial_hpp: initialHpp })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDbVariant(id: number, color: string, stockQty: number, stockRejectQty: number, initialHpp?: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const updatePayload: any = { color, stock_qty: stockQty, stock_reject_qty: stockRejectQty };
  if (initialHpp !== undefined) updatePayload.initial_hpp = initialHpp;

  const { data, error } = await supabase
    .from('product_variants')
    .update(updatePayload)
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
  const { data, error } = await supabase
    .from('fabric_stock')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createDbFabric(name: string, unit = 'meter', stockQty = 0, initialUnitPrice = 0) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('fabric_stock')
    .insert({ name, unit, stock_qty: stockQty, initial_unit_price: initialUnitPrice })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDbFabric(id: number, name: string, unit: string, stockQty: number, initialUnitPrice?: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const updatePayload: any = { name, unit, stock_qty: stockQty };
  if (initialUnitPrice !== undefined) updatePayload.initial_unit_price = initialUnitPrice;

  const { data, error } = await supabase
    .from('fabric_stock')
    .update(updatePayload)
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
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createDbRawMaterial(name: string, unit = 'pcs', stockQty = 0, initialUnitPrice = 0) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('raw_materials')
    .insert({ name, unit, stock_qty: stockQty, initial_unit_price: initialUnitPrice })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDbRawMaterial(id: number, name: string, unit: string, stockQty: number, initialUnitPrice?: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const updatePayload: any = { name, unit, stock_qty: stockQty };
  if (initialUnitPrice !== undefined) updatePayload.initial_unit_price = initialUnitPrice;

  const { data, error } = await supabase
    .from('raw_materials')
    .update(updatePayload)
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
    .select('id, article_id, variant_id, raw_material_id, qty_per_unit, raw_materials(id, name, unit, stock_qty)')
    .order('id');
  if (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
  return (data || []).map((r: any) => {
    const rawMat = Array.isArray(r.raw_materials) ? r.raw_materials[0] : r.raw_materials;
    return {
      id: r.id,
      article_id: r.article_id,
      variant_id: r.variant_id,
      raw_material_id: r.raw_material_id,
      qty_per_piece: Number(r.qty_per_unit),
      raw_materials: rawMat ? {
        id: Number(rawMat.id),
        name: String(rawMat.name || ''),
        unit: String(rawMat.unit || 'pcs'),
        stock_qty: Number(rawMat.stock_qty || 0),
      } : undefined,
    };
  });
}

export async function saveDbRecipe(articleId: number, rawMaterialId: number, qtyPerUnit: number, variantId?: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const payload: any = { article_id: articleId, raw_material_id: rawMaterialId, qty_per_unit: qtyPerUnit };
  if (variantId) payload.variant_id = variantId;

  const { data, error } = await supabase
    .from('product_recipes')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveDbVariantRecipesBatch(
  variantId: number,
  recipes: { raw_material_id: number; qty_per_unit: number }[],
  articleId?: number
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  
  let finalArticleId = articleId;
  if (!finalArticleId) {
    const { data: pv, error: pvErr } = await supabase.from('product_variants').select('article_id').eq('id', variantId).single();
    if (pvErr) throw pvErr;
    finalArticleId = pv?.article_id;
  }

  // Delete existing recipes for this variant
  const { error: delErr } = await supabase.from('product_recipes').delete().eq('variant_id', variantId);
  if (delErr) throw delErr;
  
  // Insert new recipes if any
  const validRecipes = recipes.filter(r => r.raw_material_id > 0 && r.qty_per_unit > 0);
  if (validRecipes.length > 0) {
    const rows = validRecipes.map(r => ({
      variant_id: variantId,
      article_id: finalArticleId,
      raw_material_id: r.raw_material_id,
      qty_per_unit: r.qty_per_unit,
    }));
    const { data, error } = await supabase.from('product_recipes').insert(rows).select();
    if (error) throw error;
    return data;
  }
  return [];
}

export async function applyDbVariantRecipeToAllVariants(
  articleId: number,
  recipes: { raw_material_id: number; qty_per_unit: number }[]
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data: variants, error: varErr } = await supabase
    .from('product_variants')
    .select('id')
    .eq('article_id', articleId);
  if (varErr) throw varErr;
  if (!variants || variants.length === 0) return [];

  const validRecipes = recipes.filter(r => r.raw_material_id > 0 && r.qty_per_unit > 0);
  const variantIds = variants.map(v => v.id);

  // 1. Delete all existing recipes for all variants of this article
  const { error: delVarErr } = await supabase
    .from('product_recipes')
    .delete()
    .in('variant_id', variantIds);
  if (delVarErr) throw delVarErr;

  // 2. Also delete article-level recipes without variant_id for this article so they don't conflict
  await supabase
    .from('product_recipes')
    .delete()
    .eq('article_id', articleId)
    .is('variant_id', null);

  // 3. Batch insert recipes for all variants
  if (validRecipes.length > 0) {
    const allRows: any[] = [];
    for (const v of variants) {
      for (const r of validRecipes) {
        allRows.push({
          variant_id: v.id,
          article_id: articleId,
          raw_material_id: r.raw_material_id,
          qty_per_unit: r.qty_per_unit,
        });
      }
    }
    const { data, error: insErr } = await supabase
      .from('product_recipes')
      .insert(allRows)
      .select();
    if (insErr) throw insErr;
    return data;
  }
  return [];
}

export async function saveDbArticleRecipesBatch(
  articleId: number,
  recipes: { raw_material_id: number; qty_per_unit: number }[]
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  
  // Delete existing recipes for this article
  await supabase.from('product_recipes').delete().eq('article_id', articleId);
  
  // Insert new recipes if any
  const validRecipes = recipes.filter(r => r.raw_material_id > 0 && r.qty_per_unit > 0);
  if (validRecipes.length > 0) {
    const rows = validRecipes.map(r => ({
      article_id: articleId,
      raw_material_id: r.raw_material_id,
      qty_per_unit: r.qty_per_unit,
    }));
    const { data, error } = await supabase.from('product_recipes').insert(rows).select();
    if (error) throw error;
    return data;
  }
  return [];
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
  const { data, error } = await supabase
    .from('sales_channels')
    .select('*')
    .order('name', { ascending: true });
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

export async function updateDbChannel(id: number, name: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('sales_channels')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
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

export async function updateDbPurchase(
  id: number,
  updated: {
    item_type: 'raw_material' | 'fabric';
    raw_material_id?: number | null;
    fabric_stock_id?: number | null;
    qty: number;
    unit_price: number;
    supplier?: string;
    purchase_date: string;
  }
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');

  // 1. Get old purchase to rollback stock
  const { data: oldP } = await supabase.from('purchases').select('*').eq('id', id).single();
  if (oldP) {
    if (oldP.item_type === 'fabric' && oldP.fabric_stock_id) {
      const { data: fs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', oldP.fabric_stock_id).single();
      if (fs) {
        await supabase.from('fabric_stock').update({
          stock_qty: Math.max(0, Number(fs.stock_qty || 0) - Number(oldP.qty || 0))
        }).eq('id', oldP.fabric_stock_id);
      }
    } else if (oldP.item_type === 'raw_material' && oldP.raw_material_id) {
      const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', oldP.raw_material_id).single();
      if (rm) {
        await supabase.from('raw_materials').update({
          stock_qty: Math.max(0, Number(rm.stock_qty || 0) - Number(oldP.qty || 0))
        }).eq('id', oldP.raw_material_id);
      }
    }
  }

  // 2. Update purchase record
  const { data, error } = await supabase
    .from('purchases')
    .update({
      item_type: updated.item_type,
      raw_material_id: updated.raw_material_id ?? null,
      fabric_stock_id: updated.fabric_stock_id ?? null,
      qty: updated.qty,
      unit_price: updated.unit_price,
      supplier: updated.supplier || null,
      purchase_date: updated.purchase_date,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // 3. Apply new stock addition
  if (updated.item_type === 'fabric' && updated.fabric_stock_id) {
    const { data: newFs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', updated.fabric_stock_id).single();
    if (newFs) {
      await supabase.from('fabric_stock').update({
        stock_qty: Number(newFs.stock_qty || 0) + updated.qty
      }).eq('id', updated.fabric_stock_id);
    }
  } else if (updated.item_type === 'raw_material' && updated.raw_material_id) {
    const { data: newRm } = await supabase.from('raw_materials').select('stock_qty').eq('id', updated.raw_material_id).single();
    if (newRm) {
      await supabase.from('raw_materials').update({
        stock_qty: Number(newRm.stock_qty || 0) + updated.qty
      }).eq('id', updated.raw_material_id);
    }
  }

  return data;
}

export async function deleteDbPurchase(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');

  // Rollback physical stock on purchase delete
  const { data: oldP } = await supabase.from('purchases').select('*').eq('id', id).single();
  if (oldP) {
    if (oldP.item_type === 'fabric' && oldP.fabric_stock_id) {
      const { data: fs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', oldP.fabric_stock_id).single();
      if (fs) {
        await supabase.from('fabric_stock').update({
          stock_qty: Math.max(0, Number(fs.stock_qty || 0) - Number(oldP.qty || 0))
        }).eq('id', oldP.fabric_stock_id);
      }
    } else if (oldP.item_type === 'raw_material' && oldP.raw_material_id) {
      const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', oldP.raw_material_id).single();
      if (rm) {
        await supabase.from('raw_materials').update({
          stock_qty: Math.max(0, Number(rm.stock_qty || 0) - Number(oldP.qty || 0))
        }).eq('id', oldP.raw_material_id);
      }
    }
  }

  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) throw error;
}

// Helper to extract multi-fabric usage from notes
function extractFabricsFromNotes(notes?: string, defaultFabricId?: number | null, defaultFabricUsed?: number): { fabric_stock_id: number; fabric_used: number }[] {
  if (notes && notes.includes('[MULTI_FABRIC:')) {
    try {
      const match = notes.match(/\[MULTI_FABRIC:(.*?)\]/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            fabric_stock_id: Number(item.fabric_stock_id),
            fabric_used: Number(item.fabric_used),
          }));
        }
      }
    } catch (e) {
      console.error('Error parsing MULTI_FABRIC tag:', e);
    }
  }
  if (defaultFabricId && Number(defaultFabricUsed || 0) > 0) {
    return [{ fabric_stock_id: Number(defaultFabricId), fabric_used: Number(defaultFabricUsed) }];
  }
  return [];
}

export async function getDbProductionBatches() {
  if (!isSupabaseConfigured()) return [];
  const [{ data: batches, error: batchErr }, { data: purchases }, { data: allFabrics }] = await Promise.all([
    supabase
      .from('production_batches')
      .select('*, product_variants(id, color, article_id, stock_qty, stock_reject_qty, articles(name)), fabric_stock(name, unit), production_costs(*), production_batch_materials(*, raw_materials(name, unit))')
      .order('production_date', { ascending: false }),
    supabase.from('purchases').select('item_type, fabric_stock_id, raw_material_id, qty, unit_price'),
    supabase.from('fabric_stock').select('id, name, unit'),
  ]);

  if (batchErr) throw batchErr;

  const fabricMap = new Map<number, { name: string; unit: string }>();
  (allFabrics || []).forEach(f => fabricMap.set(f.id, { name: f.name, unit: f.unit || 'meter' }));

  // Calculate weighted average price for fabrics & raw materials
  const fabricPriceMap = new Map<number, { totalCost: number; totalQty: number }>();
  const rawPriceMap = new Map<number, { totalCost: number; totalQty: number }>();

  (purchases || []).forEach(p => {
    const qty = Number(p.qty || 0);
    const unitPrice = Number(p.unit_price || 0);
    if (p.item_type === 'fabric' && p.fabric_stock_id) {
      const cur = fabricPriceMap.get(p.fabric_stock_id) || { totalCost: 0, totalQty: 0 };
      fabricPriceMap.set(p.fabric_stock_id, {
        totalCost: cur.totalCost + (qty * unitPrice),
        totalQty: cur.totalQty + qty,
      });
    } else if (p.item_type === 'raw_material' && p.raw_material_id) {
      const cur = rawPriceMap.get(p.raw_material_id) || { totalCost: 0, totalQty: 0 };
      rawPriceMap.set(p.raw_material_id, {
        totalCost: cur.totalCost + (qty * unitPrice),
        totalQty: cur.totalQty + qty,
      });
    }
  });

  return (batches || []).map(b => {
    const totalCut = Number(b.qty_produced || 0) + Number(b.qty_reject || 0);
    
    // Extract multi-fabric if recorded
    const fabricsUsedList = extractFabricsFromNotes(b.notes, b.fabric_stock_id, b.fabric_used);
    const totalFabricMtr = fabricsUsedList.reduce((sum, f) => sum + Number(f.fabric_used || 0), 0);
    const fabricMtr = totalFabricMtr > 0 ? totalFabricMtr : Number(b.fabric_used || 0);
    const yieldRatio = totalCut > 0 && fabricMtr > 0 ? Number((totalCut / fabricMtr).toFixed(1)) : 0;
    
    // Labor cost
    const laborCost = b.production_costs?.find((c: any) => c.cost_type === 'tenaga_kerja')?.amount || 0;
    const laborPerPcs = totalCut > 0 ? Math.round(Number(laborCost) / totalCut) : 30000;
    const isPaid = !b.notes?.includes('[BELUM_DIBAYAR]');

    // Fabric cost (sum of all fabrics used)
    let totalFabricCost = 0;
    const fabricsDetail = fabricsUsedList.map((f, idx) => {
      let avgPrice = 30000;
      if (f.fabric_stock_id && fabricPriceMap.has(f.fabric_stock_id)) {
        const fp = fabricPriceMap.get(f.fabric_stock_id)!;
        avgPrice = fp.totalQty > 0 ? fp.totalCost / fp.totalQty : 30000;
      }
      const itemCost = Math.round(Number(f.fabric_used) * avgPrice);
      totalFabricCost += itemCost;
      const fabInfo = fabricMap.get(f.fabric_stock_id);
      return {
        fabric_stock_id: f.fabric_stock_id,
        fabric_name: fabInfo?.name || (idx === 0 ? b.fabric_stock?.name : 'Kain Kombinasi'),
        unit: fabInfo?.unit || 'meter',
        fabric_used: Number(f.fabric_used),
        unit_price: avgPrice,
        cost: itemCost,
        is_primary: idx === 0,
      };
    });

    if (fabricsDetail.length === 0) {
      let avgPrice = 30000;
      if (b.fabric_stock_id && fabricPriceMap.has(b.fabric_stock_id)) {
        const fp = fabricPriceMap.get(b.fabric_stock_id)!;
        avgPrice = fp.totalQty > 0 ? fp.totalCost / fp.totalQty : 30000;
      }
      totalFabricCost = Math.round(fabricMtr * avgPrice);
    }

    // Raw materials / Accessories (BOM) cost
    let accessoriesCost = 0;
    (b.production_batch_materials || []).forEach((bm: any) => {
      const mQty = Number(bm.qty_used || 0);
      let mPrice = 0;
      if (bm.raw_material_id && rawPriceMap.has(bm.raw_material_id)) {
        const rp = rawPriceMap.get(bm.raw_material_id)!;
        mPrice = rp.totalQty > 0 ? rp.totalCost / rp.totalQty : 0;
      }
      accessoriesCost += Math.round(mQty * mPrice);
    });

    const totalProductionCost = totalFabricCost + Number(laborCost) + accessoriesCost;
    const unitCost = totalCut > 0 ? Math.round(totalProductionCost / totalCut) : 0;

    return {
      id: b.id,
      batch_date: b.production_date,
      article_id: b.product_variants?.article_id,
      variant_id: b.variant_id,
      fabric_stock_id: b.fabric_stock_id,
      qty_produced: Number(b.qty_produced || 0),
      qty_reject: Number(b.qty_reject || 0),
      total_cut: totalCut,
      fabric_used: fabricMtr,
      fabrics_used_details: fabricsDetail,
      yield_ratio: yieldRatio,
      cost_per_pcs: laborPerPcs,
      total_sewing_cost: Number(laborCost),
      fabric_cost: totalFabricCost,
      accessories_cost: accessoriesCost,
      total_production_cost: totalProductionCost,
      unit_cost: unitCost, // HPP per pcs
      is_paid: isPaid,
      articles: b.product_variants?.articles,
      variants: b.product_variants,
      fabric_stock: b.fabric_stock,
      batch_materials: b.production_batch_materials || [],
    };
  });
}

export async function createDbProductionBatch(batch: {
  variant_id: number;
  qty_produced: number;
  qty_reject: number;
  fabric_stock_id?: number | null;
  fabric_used?: number;
  cost_per_pcs?: number;
  total_sewing_cost?: number;
  is_paid?: boolean;
  production_date?: string;
  batch_date?: string;
  yield_ratio?: number;
  article_id?: number;
  paid_date?: string;
  notes?: string;
  fabrics?: { fabric_stock_id: number; fabric_used: number }[];
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const totalCut = batch.qty_produced + batch.qty_reject;
  const costPcs = batch.cost_per_pcs ?? 30000;
  const totalLaborCost = batch.total_sewing_cost ?? (totalCut * costPcs);
  const prodDate = batch.production_date || batch.batch_date || new Date().toISOString().split('T')[0];
  const paidTag = batch.is_paid ? '[SUDAH_DIBAYAR]' : '[BELUM_DIBAYAR]';

  // Process multi-fabric if provided
  const fabricList = batch.fabrics && batch.fabrics.length > 0
    ? batch.fabrics.filter(f => f.fabric_stock_id && Number(f.fabric_used) > 0)
    : (batch.fabric_stock_id && Number(batch.fabric_used || 0) > 0 
        ? [{ fabric_stock_id: batch.fabric_stock_id, fabric_used: Number(batch.fabric_used) }] 
        : []);

  const primaryFabric = fabricList.length > 0 ? fabricList[0] : { fabric_stock_id: batch.fabric_stock_id || null, fabric_used: batch.fabric_used || 0 };
  const multiFabricTag = fabricList.length > 0 ? `[MULTI_FABRIC:${JSON.stringify(fabricList)}]` : '';
  const cleanNotes = (batch.notes || '').replace(/\[MULTI_FABRIC:.*?\]/g, '').trim();
  const finalNotes = `${paidTag} ${multiFabricTag} ${cleanNotes}`.trim();

  // Insert batch
  const { data: newBatch, error: batchErr } = await supabase
    .from('production_batches')
    .insert({
      variant_id: batch.variant_id,
      qty_produced: batch.qty_produced,
      qty_reject: batch.qty_reject,
      fabric_stock_id: primaryFabric.fabric_stock_id,
      fabric_used: primaryFabric.fabric_used,
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

  // Deduct & record BOM recipes if variant_id/article_id is present or discoverable
  let articleId = batch.article_id;
  if (!articleId && batch.variant_id) {
    const { data: vData } = await supabase.from('product_variants').select('article_id').eq('id', batch.variant_id).single();
    if (vData) articleId = vData.article_id;
  }

  if (batch.variant_id && totalCut > 0) {
    // 1. Look up recipes for this specific variant first
    let { data: recipes } = await supabase.from('product_recipes').select('*').eq('variant_id', batch.variant_id);
    
    // 2. Fallback to article-level recipe if no variant-specific recipe
    if (!recipes || recipes.length === 0) {
      if (articleId) {
        const { data: artRec } = await supabase.from('product_recipes').select('*').eq('article_id', articleId);
        recipes = artRec;
      }
    }

    if (recipes && recipes.length > 0) {
      for (const rec of recipes) {
        const qtyUsed = Number(rec.qty_per_unit) * totalCut;
        // Record to production_batch_materials
        await supabase.from('production_batch_materials').insert({
          batch_id: newBatch.id,
          raw_material_id: rec.raw_material_id,
          qty_used: qtyUsed,
        });

        // Deduct raw materials stock
        const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', rec.raw_material_id).single();
        if (rm) {
          await supabase.from('raw_materials').update({
            stock_qty: Math.max(0, Number(rm.stock_qty) - qtyUsed),
          }).eq('id', rec.raw_material_id);
        }
      }
    }
  }

  // Update variant stock (finished stock + Grade A, reject stock + Reject)
  const { data: pv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', batch.variant_id).single();
  if (pv) {
    await supabase.from('product_variants').update({
      stock_qty: Number(pv.stock_qty || 0) + batch.qty_produced,
      stock_reject_qty: Number(pv.stock_reject_qty || 0) + batch.qty_reject,
    }).eq('id', batch.variant_id);
  }

  // Deduct physical stock for all fabrics used
  for (const fab of fabricList) {
    if (fab.fabric_stock_id && Number(fab.fabric_used) > 0) {
      const { data: fs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', fab.fabric_stock_id).single();
      if (fs) {
        await supabase.from('fabric_stock').update({
          stock_qty: Math.max(0, Number(fs.stock_qty) - Number(fab.fabric_used)),
        }).eq('id', fab.fabric_stock_id);
      }
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

export async function updateDbProductionBatch(batch: {
  id: number;
  variant_id: number;
  qty_produced: number;
  qty_reject: number;
  fabric_stock_id?: number | null;
  fabric_used?: number;
  cost_per_pcs?: number;
  total_sewing_cost?: number;
  is_paid?: boolean;
  production_date?: string;
  notes?: string;
  fabrics?: { fabric_stock_id: number; fabric_used: number }[];
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  
  // 1. Get old batch
  const { data: oldBatch, error: oldErr } = await supabase
    .from('production_batches')
    .select('*, production_batch_materials(*), production_costs(*)')
    .eq('id', batch.id)
    .single();
  if (oldErr || !oldBatch) throw new Error('Batch tidak ditemukan');

  const newTotalCut = batch.qty_produced + batch.qty_reject;
  const costPcs = batch.cost_per_pcs ?? 30000;
  const newTotalLaborCost = batch.total_sewing_cost ?? (newTotalCut * costPcs);
  const prodDate = batch.production_date || oldBatch.production_date;

  // Process new multi-fabric list
  const newFabricList = batch.fabrics && batch.fabrics.length > 0
    ? batch.fabrics.filter(f => f.fabric_stock_id && Number(f.fabric_used) > 0)
    : (batch.fabric_stock_id && Number(batch.fabric_used || 0) > 0 
        ? [{ fabric_stock_id: batch.fabric_stock_id, fabric_used: Number(batch.fabric_used) }] 
        : []);

  const primaryFabric = newFabricList.length > 0 ? newFabricList[0] : { fabric_stock_id: batch.fabric_stock_id || null, fabric_used: batch.fabric_used || 0 };
  const multiFabricTag = newFabricList.length > 0 ? `[MULTI_FABRIC:${JSON.stringify(newFabricList)}]` : '';

  // Maintain paid status in notes
  const isPaid = batch.is_paid !== undefined ? batch.is_paid : !oldBatch.notes?.includes('[BELUM_DIBAYAR]');
  const paidTag = isPaid ? '[SUDAH_DIBAYAR]' : '[BELUM_DIBAYAR]';
  const cleanNotes = (batch.notes || oldBatch.notes || '')
    .replace('[SUDAH_DIBAYAR]', '')
    .replace('[BELUM_DIBAYAR]', '')
    .replace(/\[MULTI_FABRIC:.*?\]/g, '')
    .trim();
  const finalNotes = `${paidTag} ${multiFabricTag} ${cleanNotes}`.trim();

  // 2. Revert old variant stock
  const { data: oldPv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', oldBatch.variant_id).single();
  if (oldPv) {
    await supabase.from('product_variants').update({
      stock_qty: Math.max(0, Number(oldPv.stock_qty || 0) - Number(oldBatch.qty_produced || 0)),
      stock_reject_qty: Math.max(0, Number(oldPv.stock_reject_qty || 0) - Number(oldBatch.qty_reject || 0)),
    }).eq('id', oldBatch.variant_id);
  }

  // 3. Revert old fabric stock (support all old fabrics)
  const oldFabrics = extractFabricsFromNotes(oldBatch.notes, oldBatch.fabric_stock_id, oldBatch.fabric_used);
  for (const ofab of oldFabrics) {
    if (ofab.fabric_stock_id && Number(ofab.fabric_used) > 0) {
      const { data: oldFs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', ofab.fabric_stock_id).single();
      if (oldFs) {
        await supabase.from('fabric_stock').update({
          stock_qty: Number(oldFs.stock_qty || 0) + Number(ofab.fabric_used || 0),
        }).eq('id', ofab.fabric_stock_id);
      }
    }
  }

  // 4. Revert old raw material stock
  for (const bm of (oldBatch.production_batch_materials || [])) {
    const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', bm.raw_material_id).single();
    if (rm) {
      await supabase.from('raw_materials').update({
        stock_qty: Number(rm.stock_qty || 0) + Number(bm.qty_used || 0),
      }).eq('id', bm.raw_material_id);
    }
  }
  await supabase.from('production_batch_materials').delete().eq('batch_id', batch.id);

  // 5. Update production_batches row
  const { data: updatedBatch, error: updateErr } = await supabase
    .from('production_batches')
    .update({
      variant_id: batch.variant_id,
      qty_produced: batch.qty_produced,
      qty_reject: batch.qty_reject,
      fabric_stock_id: primaryFabric.fabric_stock_id,
      fabric_used: primaryFabric.fabric_used,
      production_date: prodDate,
      notes: finalNotes,
    })
    .eq('id', batch.id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  // 6. Update production labor cost
  await supabase.from('production_costs').delete().eq('batch_id', batch.id);
  if (newTotalLaborCost > 0) {
    await supabase.from('production_costs').insert({
      batch_id: batch.id,
      cost_type: 'tenaga_kerja',
      amount: newTotalLaborCost,
    });
  }

  // 7. Apply new raw material consumption
  const { data: vData } = await supabase.from('product_variants').select('article_id').eq('id', batch.variant_id).single();
  const articleId = vData?.article_id;
  if (batch.variant_id && newTotalCut > 0) {
    let { data: recipes } = await supabase.from('product_recipes').select('*').eq('variant_id', batch.variant_id);
    if (!recipes || recipes.length === 0) {
      if (articleId) {
        const { data: artRec } = await supabase.from('product_recipes').select('*').eq('article_id', articleId);
        recipes = artRec;
      }
    }

    if (recipes && recipes.length > 0) {
      for (const rec of recipes) {
        const qtyUsed = Number(rec.qty_per_unit) * newTotalCut;
        await supabase.from('production_batch_materials').insert({
          batch_id: batch.id,
          raw_material_id: rec.raw_material_id,
          qty_used: qtyUsed,
        });

        const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', rec.raw_material_id).single();
        if (rm) {
          await supabase.from('raw_materials').update({
            stock_qty: Math.max(0, Number(rm.stock_qty) - qtyUsed),
          }).eq('id', rec.raw_material_id);
        }
      }
    }
  }

  // 8. Apply new variant stock
  const { data: newPv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', batch.variant_id).single();
  if (newPv) {
    await supabase.from('product_variants').update({
      stock_qty: Number(newPv.stock_qty || 0) + batch.qty_produced,
      stock_reject_qty: Number(newPv.stock_reject_qty || 0) + batch.qty_reject,
    }).eq('id', batch.variant_id);
  }

  // 9. Apply new fabric stock deductions (for all fabrics)
  for (const fab of newFabricList) {
    if (fab.fabric_stock_id && Number(fab.fabric_used) > 0) {
      const { data: newFs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', fab.fabric_stock_id).single();
      if (newFs) {
        await supabase.from('fabric_stock').update({
          stock_qty: Math.max(0, Number(newFs.stock_qty || 0) - Number(fab.fabric_used)),
        }).eq('id', fab.fabric_stock_id);
      }
    }
  }

  return updatedBatch;
}

export async function deleteDbProductionBatch(id: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');

  // 1. Get batch data to rollback
  const { data: oldBatch } = await supabase
    .from('production_batches')
    .select('*, production_batch_materials(*)')
    .eq('id', id)
    .single();

  if (oldBatch) {
    // Revert variant stock
    const { data: pv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', oldBatch.variant_id).single();
    if (pv) {
      await supabase.from('product_variants').update({
        stock_qty: Math.max(0, Number(pv.stock_qty || 0) - Number(oldBatch.qty_produced || 0)),
        stock_reject_qty: Math.max(0, Number(pv.stock_reject_qty || 0) - Number(oldBatch.qty_reject || 0)),
      }).eq('id', oldBatch.variant_id);
    }

    // Revert all fabrics used (multi-fabric aware)
    const oldFabrics = extractFabricsFromNotes(oldBatch.notes, oldBatch.fabric_stock_id, oldBatch.fabric_used);
    for (const ofab of oldFabrics) {
      if (ofab.fabric_stock_id && Number(ofab.fabric_used) > 0) {
        const { data: fs } = await supabase.from('fabric_stock').select('stock_qty').eq('id', ofab.fabric_stock_id).single();
        if (fs) {
          await supabase.from('fabric_stock').update({
            stock_qty: Number(fs.stock_qty || 0) + Number(ofab.fabric_used || 0),
          }).eq('id', ofab.fabric_stock_id);
        }
      }
    }

    // Revert raw materials
    for (const bm of (oldBatch.production_batch_materials || [])) {
      const { data: rm } = await supabase.from('raw_materials').select('stock_qty').eq('id', bm.raw_material_id).single();
      if (rm) {
        await supabase.from('raw_materials').update({
          stock_qty: Number(rm.stock_qty || 0) + Number(bm.qty_used || 0),
        }).eq('id', bm.raw_material_id);
      }
    }

    // Delete dependent tables
    await supabase.from('production_batch_materials').delete().eq('batch_id', id);
    await supabase.from('production_costs').delete().eq('batch_id', id);
  }

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
  
  // Revert stock on sale delete
  const { data: s } = await supabase.from('sales').select('*').eq('id', id).single();
  if (s) {
    const { data: pv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', s.variant_id).single();
    if (pv) {
      if (s.item_grade === 'grade_a') {
        await supabase.from('product_variants').update({
          stock_qty: Number(pv.stock_qty || 0) + Number(s.qty || 0),
        }).eq('id', s.variant_id);
      } else {
        await supabase.from('product_variants').update({
          stock_reject_qty: Number(pv.stock_reject_qty || 0) + Number(s.qty || 0),
        }).eq('id', s.variant_id);
      }
    }
  }

  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

export async function updateDbSale(
  id: number,
  sale: {
    variant_id: number;
    channel_id: number;
    item_grade: 'grade_a' | 'reject';
    qty: number;
    sale_price: number;
    sale_date: string;
  }
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');

  // 1. Get old sale to revert stock
  const { data: oldS } = await supabase.from('sales').select('*').eq('id', id).single();
  if (oldS) {
    const { data: pv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', oldS.variant_id).single();
    if (pv) {
      if (oldS.item_grade === 'grade_a') {
        await supabase.from('product_variants').update({
          stock_qty: Number(pv.stock_qty || 0) + Number(oldS.qty || 0),
        }).eq('id', oldS.variant_id);
      } else {
        await supabase.from('product_variants').update({
          stock_reject_qty: Number(pv.stock_reject_qty || 0) + Number(oldS.qty || 0),
        }).eq('id', oldS.variant_id);
      }
    }
  }

  // 2. Update sale record
  const { data: updatedSale, error } = await supabase
    .from('sales')
    .update({
      variant_id: sale.variant_id,
      channel_id: sale.channel_id,
      item_grade: sale.item_grade,
      qty: sale.qty,
      sale_price: sale.sale_price,
      sale_date: sale.sale_date,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // 3. Deduct new stock
  const { data: newPv } = await supabase.from('product_variants').select('stock_qty, stock_reject_qty').eq('id', sale.variant_id).single();
  if (newPv) {
    if (sale.item_grade === 'grade_a') {
      await supabase.from('product_variants').update({
        stock_qty: Math.max(0, Number(newPv.stock_qty || 0) - sale.qty),
      }).eq('id', sale.variant_id);
    } else {
      await supabase.from('product_variants').update({
        stock_reject_qty: Math.max(0, Number(newPv.stock_reject_qty || 0) - sale.qty),
      }).eq('id', sale.variant_id);
    }
  }

  return updatedSale;
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

export async function updateDbExpense(
  id: number,
  expense: {
    category: string;
    amount: number;
    expense_date: string;
    notes?: string;
  }
) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('expenses')
    .update({
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      notes: expense.notes || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==========================================
// 10. DASHBOARD SUMMARY & LIVE METRICS
// ==========================================
export async function getDbDashboardSummary() {
  if (!isSupabaseConfigured()) return null;

  try {
    const [cashRes, variantsRes, fabricRes, rawRes, salesRes, batchRes, purchasesRes, settingsRes, recipesRes] = await Promise.all([
      supabase.from('v_current_cash_balance').select('*').single(),
      supabase.from('product_variants').select('id, color, stock_qty, stock_reject_qty, initial_hpp, article_id, articles(id, name)'),
      supabase.from('fabric_stock').select('id, name, stock_qty, unit, initial_unit_price'),
      supabase.from('raw_materials').select('id, name, stock_qty, unit, initial_unit_price'),
      supabase.from('sales').select('variant_id, qty, sale_price, item_grade, sale_date'),
      supabase.from('production_batches').select('id, variant_id, qty_produced, qty_reject, fabric_used, fabric_stock_id, production_date, production_costs(amount), production_batch_materials(qty_used, raw_material_id)'),
      supabase.from('purchases').select('item_type, fabric_stock_id, raw_material_id, qty, unit_price'),
      supabase.from('app_settings').select('key, value'),
      supabase.from('product_recipes').select('article_id, variant_id, raw_material_id, qty_per_unit'),
    ]);

    const settingsMap = new Map<string, string>();
    (settingsRes.data || []).forEach((s: any) => settingsMap.set(s.key, s.value || ''));
    const initialCashFromSettings = Number(settingsMap.get('initial_cash_balance') || 0);

    const totalFinishedStock = (variantsRes.data || []).reduce((acc, curr) => acc + (curr.stock_qty || 0), 0);
    const totalRejectStock = (variantsRes.data || []).reduce((acc, curr) => acc + (curr.stock_reject_qty || 0), 0);
    const totalFabricStock = (fabricRes.data || []).reduce((acc, curr) => acc + Number(curr.stock_qty || 0), 0);
    const totalRawMaterialStock = (rawRes.data || []).reduce((acc, curr) => acc + Number(curr.stock_qty || 0), 0);

    const totalSalesRevenue = (salesRes.data || []).reduce((acc, curr) => acc + (curr.qty * curr.sale_price), 0);
    const regularSalesRevenue = (salesRes.data || []).filter(s => s.item_grade === 'grade_a').reduce((acc, curr) => acc + (curr.qty * curr.sale_price), 0);
    const rejectSalesRevenue = (salesRes.data || []).filter(s => s.item_grade === 'reject').reduce((acc, curr) => acc + (curr.qty * curr.sale_price), 0);

    // Calculate dynamic weighted average price for fabrics & raw materials
    const fabricPriceMap = new Map<number, { cost: number; qty: number }>();
    const rawPriceMap = new Map<number, { cost: number; qty: number }>();

    (purchasesRes.data || []).forEach(p => {
      const pQty = Number(p.qty || 0);
      const pPrice = Number(p.unit_price || 0);
      if (p.item_type === 'fabric' && p.fabric_stock_id) {
        const cur = fabricPriceMap.get(p.fabric_stock_id) || { cost: 0, qty: 0 };
        fabricPriceMap.set(p.fabric_stock_id, {
          cost: cur.cost + (pQty * pPrice),
          qty: cur.qty + pQty,
        });
      } else if (p.item_type === 'raw_material' && p.raw_material_id) {
        const cur = rawPriceMap.get(p.raw_material_id) || { cost: 0, qty: 0 };
        rawPriceMap.set(p.raw_material_id, {
          cost: cur.cost + (pQty * pPrice),
          qty: cur.qty + pQty,
        });
      }
    });

    const variantCostMap = new Map<number, { totalCost: number; totalQty: number }>();
    let totalAllBatchCost = 0;
    let totalAllBatchCut = 0;

    (batchRes.data || []).forEach((b: any) => {
      const cut = Number(b.qty_produced || 0) + Number(b.qty_reject || 0);
      const labor = b.production_costs?.reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0) || 0;
      
      const fabricObj = (fabricRes.data || []).find((f: any) => f.id === b.fabric_stock_id);
      const fp = b.fabric_stock_id ? fabricPriceMap.get(b.fabric_stock_id) : null;
      const initialFabPrice = fabricObj && typeof fabricObj.initial_unit_price !== 'undefined' ? Number(fabricObj.initial_unit_price) : 0;
      const avgFabPrice = fp && fp.qty > 0 ? fp.cost / fp.qty : (initialFabPrice > 0 ? initialFabPrice : 30000);
      const fabCost = Math.round(Number(b.fabric_used || 0) * avgFabPrice);

      let accessoriesCost = 0;
      (b.production_batch_materials || []).forEach((bm: any) => {
        const mQty = Number(bm.qty_used || 0);
        const rawObj = (rawRes.data || []).find((r: any) => r.id === bm.raw_material_id);
        const initialRawPrice = rawObj && typeof rawObj.initial_unit_price !== 'undefined' ? Number(rawObj.initial_unit_price) : 0;
        let mPrice = 0;
        if (bm.raw_material_id && rawPriceMap.has(bm.raw_material_id)) {
          const rp = rawPriceMap.get(bm.raw_material_id)!;
          mPrice = rp.qty > 0 ? rp.cost / rp.qty : (initialRawPrice > 0 ? initialRawPrice : 0);
        } else if (initialRawPrice > 0) {
          mPrice = initialRawPrice;
        }
        accessoriesCost += Math.round(mQty * mPrice);
      });

      const batchCost = labor + fabCost + accessoriesCost;

      totalAllBatchCost += batchCost;
      totalAllBatchCut += cut;

      if (b.variant_id && cut > 0) {
        const cur = variantCostMap.get(b.variant_id) || { totalCost: 0, totalQty: 0 };
        variantCostMap.set(b.variant_id, {
          totalCost: cur.totalCost + batchCost,
          totalQty: cur.totalQty + cut,
        });
      }
    });

    // Compute estimated BOM cost per variant from recipes if no batches exist
    let totalRecipeBomSum = 0;
    let variantsWithRecipeCount = 0;
    const recipesData = recipesRes.data || [];

    (variantsRes.data || []).forEach((v: any) => {
      const vRecipes = recipesData.filter((r: any) => r.variant_id === v.id || (!r.variant_id && r.article_id === v.article_id));
      if (vRecipes.length > 0) {
        let bomCost = 0;
        vRecipes.forEach((r: any) => {
          const rawObj = (rawRes.data || []).find((rm: any) => rm.id === r.raw_material_id);
          const rp = r.raw_material_id ? rawPriceMap.get(r.raw_material_id) : null;
          const initialRawPrice = rawObj && typeof rawObj.initial_unit_price !== 'undefined' ? Number(rawObj.initial_unit_price) : 0;
          const unitPrice = rp && rp.qty > 0 ? rp.cost / rp.qty : (initialRawPrice > 0 ? initialRawPrice : 500);
          bomCost += Number(r.qty_per_unit || 1) * unitPrice;
        });
        // Estimasi kain standar 1.2m @ 25k (30k) + estimasi jahit CMT 15k
        bomCost += 30000 + 15000;
        totalRecipeBomSum += bomCost;
        variantsWithRecipeCount++;
      }
    });

    const fallbackRecipeAvg = variantsWithRecipeCount > 0 ? Math.round(totalRecipeBomSum / variantsWithRecipeCount) : 0;
    const avgHppOverall = totalAllBatchCut > 0 
      ? Math.round(totalAllBatchCost / totalAllBatchCut) 
      : fallbackRecipeAvg;

    // Track sale prices for potential revenue calculation
    const variantSalePriceMap = new Map<number, { totalRevenue: number; totalQty: number }>();
    (salesRes.data || []).forEach(s => {
      if (s.item_grade === 'grade_a') {
        const cur = variantSalePriceMap.get(s.variant_id) || { totalRevenue: 0, totalQty: 0 };
        variantSalePriceMap.set(s.variant_id, {
          totalRevenue: cur.totalRevenue + (s.qty * s.sale_price),
          totalQty: cur.totalQty + s.qty,
        });
      }
    });

    let totalCogs = 0;
    (salesRes.data || []).forEach(s => {
      const vc = variantCostMap.get(s.variant_id);
      const vObj = (variantsRes.data || []).find((v: any) => v.id === s.variant_id);
      const initialHppVal = vObj && typeof vObj.initial_hpp !== 'undefined' ? Number(vObj.initial_hpp) : 0;
      const uCost = vc && vc.totalQty > 0 
        ? Math.round(vc.totalCost / vc.totalQty) 
        : (initialHppVal > 0 ? initialHppVal : avgHppOverall);
      totalCogs += s.qty * uCost;
    });

    const grossProfit = totalSalesRevenue - totalCogs;
    const grossMarginPct = totalSalesRevenue > 0 ? Number(((grossProfit / totalSalesRevenue) * 100).toFixed(1)) : 0;

    // 1. Finished Goods Valuation (Grade A)
    let finishedStockValuation = 0;
    let potentialFinishedRevenue = 0;
    const finishedItemDetails: any[] = [];

    (variantsRes.data || []).forEach((v: any) => {
      const vc = variantCostMap.get(v.id);
      const hpp = vc && vc.totalQty > 0 
        ? Math.round(vc.totalCost / vc.totalQty) 
        : (Number(v.initial_hpp || 0) > 0 ? Number(v.initial_hpp) : avgHppOverall);
      const sp = variantSalePriceMap.get(v.id);
      const avgPrice = sp && sp.totalQty > 0 ? Math.round(sp.totalRevenue / sp.totalQty) : Math.round(hpp * 1.5);

      const goodQty = Number(v.stock_qty || 0);
      const val = goodQty * hpp;
      const potRev = goodQty * avgPrice;

      finishedStockValuation += val;
      potentialFinishedRevenue += potRev;

      if (goodQty > 0 || Number(v.stock_reject_qty || 0) > 0) {
        finishedItemDetails.push({
          id: v.id,
          articleName: v.articles?.name || 'Artikel',
          color: v.color,
          goodQty,
          rejectQty: Number(v.stock_reject_qty || 0),
          hpp,
          goodValue: val,
          rejectValue: Number(v.stock_reject_qty || 0) * hpp,
          potentialRevenue: potRev,
        });
      }
    });

    // 2. Reject Goods Valuation
    let rejectStockValuation = 0;
    (variantsRes.data || []).forEach((v: any) => {
      const vc = variantCostMap.get(v.id);
      const hpp = vc && vc.totalQty > 0 
        ? Math.round(vc.totalCost / vc.totalQty) 
        : (Number(v.initial_hpp || 0) > 0 ? Number(v.initial_hpp) : avgHppOverall);
      rejectStockValuation += Number(v.stock_reject_qty || 0) * hpp;
    });

    // 3. Fabric Inventory Valuation
    let fabricStockValuation = 0;
    const fabricItemDetails: any[] = [];
    (fabricRes.data || []).forEach((f: any) => {
      const fp = fabricPriceMap.get(f.id);
      const avgPrice = fp && fp.qty > 0 
        ? Math.round(fp.cost / fp.qty) 
        : (Number(f.initial_unit_price || 0) > 0 ? Number(f.initial_unit_price) : 30000);
      const fQty = Number(f.stock_qty || 0);
      const val = Math.round(fQty * avgPrice);
      fabricStockValuation += val;

      if (fQty > 0) {
        fabricItemDetails.push({
          id: f.id,
          name: f.name,
          stockQty: fQty,
          unit: f.unit || 'meter',
          avgPrice,
          totalValue: val,
        });
      }
    });

    // 4. Raw Material / Accessories (BOM) Valuation
    let rawMaterialStockValuation = 0;
    const rawMaterialItemDetails: any[] = [];
    (rawRes.data || []).forEach((r: any) => {
      const rp = rawPriceMap.get(r.id);
      const avgPrice = rp && rp.qty > 0 
        ? Math.round(rp.cost / rp.qty) 
        : (Number(r.initial_unit_price || 0) > 0 ? Number(r.initial_unit_price) : 500);
      const rQty = Number(r.stock_qty || 0);
      const val = Math.round(rQty * avgPrice);
      rawMaterialStockValuation += val;

      if (rQty > 0) {
        rawMaterialItemDetails.push({
          id: r.id,
          name: r.name,
          stockQty: rQty,
          unit: r.unit || 'pcs',
          avgPrice,
          totalValue: val,
        });
      }
    });

    const totalInventoryValuation = finishedStockValuation + rejectStockValuation + fabricStockValuation + rawMaterialStockValuation;

    // Calculate final cash balance factoring in initial cash balance
    let finalCashBalance = Number(cashRes.data?.current_cash_balance || 0);
    // If the view did not include initial_cash_balance yet (legacy view), ensure it is added:
    if (cashRes.data && cashRes.data.initial_cash_balance === undefined && initialCashFromSettings > 0) {
      finalCashBalance += initialCashFromSettings;
    }

    return {
      cashBalance: finalCashBalance,
      initialCashBalance: Number(cashRes.data?.initial_cash_balance ?? initialCashFromSettings),
      totalRevenue: totalSalesRevenue,
      regularRevenue: regularSalesRevenue,
      rejectRevenue: rejectSalesRevenue,
      totalFinishedStock,
      totalRejectStock,
      totalFabricStock,
      totalRawMaterialStock,
      totalSKUCount: variantsRes.data?.length || 0,
      totalBatchesCount: batchRes.data?.length || 0,
      salesCount: (salesRes.data || []).length,
      avgSalePrice: (salesRes.data || []).length > 0 
        ? Math.round(totalSalesRevenue / (salesRes.data || []).reduce((a, c) => a + Number(c.qty || 0), 0)) 
        : 0,
      isCashDeficit: finalCashBalance < 0,
      hasInitialCash: initialCashFromSettings > 0,
      avgHppOverall,
      totalCogs,
      grossProfit,
      grossMarginPct,
      // Inventory Valuations
      finishedStockValuation,
      rejectStockValuation,
      fabricStockValuation,
      rawMaterialStockValuation,
      totalInventoryValuation,
      potentialFinishedRevenue,
      // Detailed Lists
      finishedItemDetails,
      fabricItemDetails,
      rawMaterialItemDetails,
    };
  } catch (err) {
    console.error('getDbDashboardSummary error:', err);
    return null;
  }
}

// ==========================================
// 11. HPP & P&L DATABASE VIEWS
// ==========================================
export async function getDbMonthlyProductionCost() {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('v_monthly_production_cost')
      .select('*');
    if (error) {
      console.warn('v_monthly_production_cost not available:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error fetching v_monthly_production_cost:', err);
    return [];
  }
}

export async function getDbMonthlyPL() {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('v_monthly_pl')
      .select('*')
      .order('month', { ascending: false });
    if (error) {
      console.warn('v_monthly_pl not available:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error fetching v_monthly_pl:', err);
    return [];
  }
}

// ==========================================
// 12. APP SETTINGS & SALDO AWAL (OPENING BALANCES)
// ==========================================
export async function getDbAppSettings() {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) {
      console.warn('app_settings table might not exist yet:', error.message);
      return {};
    }
    const settings: Record<string, string> = {};
    (data || []).forEach(item => {
      settings[item.key] = item.value;
    });
    return settings;
  } catch (err) {
    console.warn('getDbAppSettings error:', err);
    return {};
  }
}

export async function saveDbAppSetting(key: string, value: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDbInitialBalances() {
  if (!isSupabaseConfigured()) {
    return {
      initialCash: 0,
      cutoffDate: new Date().toISOString().split('T')[0],
      cutoffNotes: '',
      fabrics: [],
      rawMaterials: [],
      variants: [],
    };
  }

  const [settingsRes, fabRes, rawRes, varRes] = await Promise.all([
    supabase.from('app_settings').select('*'),
    supabase.from('fabric_stock').select('*').order('name', { ascending: true }),
    supabase.from('raw_materials').select('*').order('name', { ascending: true }),
    supabase.from('product_variants').select('*, articles(id, name)').order('color', { ascending: true }),
  ]);

  const settingsMap: Record<string, string> = {};
  (settingsRes.data || []).forEach((s: any) => {
    settingsMap[s.key] = s.value;
  });

  const sortedVariants = (varRes.data || [])
    .map((v: any) => ({
      ...v,
      article_name: v.articles?.name || 'Artikel',
    }))
    .sort((a: any, b: any) => {
      const artComp = (a.article_name || '').localeCompare(b.article_name || '', 'id');
      if (artComp !== 0) return artComp;
      return (a.color || '').localeCompare(b.color || '', 'id');
    });

  return {
    initialCash: Number(settingsMap['initial_cash_balance'] || 0),
    cutoffDate: settingsMap['cutoff_date'] || new Date().toISOString().split('T')[0],
    cutoffNotes: settingsMap['cutoff_notes'] || '',
    fabrics: fabRes.data || [],
    rawMaterials: rawRes.data || [],
    variants: sortedVariants,
  };
}

export async function saveDbInitialBalances(payload: {
  initialCash: number;
  cutoffDate: string;
  cutoffNotes: string;
  fabrics: { id: number; stock_qty: number; initial_unit_price: number }[];
  rawMaterials: { id: number; stock_qty: number; initial_unit_price: number }[];
  variants: { id: number; stock_qty: number; stock_reject_qty: number; initial_hpp: number }[];
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase belum terkonfigurasi');

  // 1. Save Settings
  try {
    await Promise.all([
      supabase.from('app_settings').upsert({ key: 'initial_cash_balance', value: String(payload.initialCash) }, { onConflict: 'key' }),
      supabase.from('app_settings').upsert({ key: 'cutoff_date', value: payload.cutoffDate }, { onConflict: 'key' }),
      supabase.from('app_settings').upsert({ key: 'cutoff_notes', value: payload.cutoffNotes }, { onConflict: 'key' }),
    ]);
  } catch (err: any) {
    console.warn('Failed to upsert app_settings (table might need migration):', err.message);
  }

  // 2. Batch Update Fabrics
  for (const fab of payload.fabrics) {
    await supabase.from('fabric_stock').update({
      stock_qty: fab.stock_qty,
      initial_unit_price: fab.initial_unit_price,
    }).eq('id', fab.id);
  }

  // 3. Batch Update Raw Materials
  for (const rm of payload.rawMaterials) {
    await supabase.from('raw_materials').update({
      stock_qty: rm.stock_qty,
      initial_unit_price: rm.initial_unit_price,
    }).eq('id', rm.id);
  }

  // 4. Batch Update Product Variants
  for (const v of payload.variants) {
    await supabase.from('product_variants').update({
      stock_qty: v.stock_qty,
      stock_reject_qty: v.stock_reject_qty,
      initial_hpp: v.initial_hpp,
    }).eq('id', v.id);
  }

  return { success: true };
}
