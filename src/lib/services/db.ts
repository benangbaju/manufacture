import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// 21 DEFAULT ARTICLES FOR SEEDING
export const default21Articles = [
  { name: 'Kemeja Lengan Panjang', description: 'Kemeja kasual pria katun', variants: ['Putih', 'Hitam', 'Navy'] },
  { name: 'Kemeja Lengan Pendek', description: 'Kemeja santai bahan katun', variants: ['Putih', 'Navy', 'Olive'] },
  { name: 'Kemeja Flanel Kotak', description: 'Flanel katun premium', variants: ['Merah Hitam', 'Biru Navy'] },
  { name: 'Kemeja Kerah Shanghai', description: 'Koko / kerah mandarin', variants: ['Putih', 'Abu-abu', 'Hitam'] },
  { name: 'Kaos Polos Oversize', description: 'Cotton Combed 24s gramasi tebal', variants: ['Putih', 'Hitam', 'Abu-abu', 'Sage Green'] },
  { name: 'Kaos Polos Reguler', description: 'Cotton Combed 30s lembut', variants: ['Hitam', 'Putih', 'Navy'] },
  { name: 'Kaos Pocket Tee', description: 'Kaos dengan saku dada', variants: ['Hitam', 'Putih', 'Khaki'] },
  { name: 'Kaos Kerah Polo', description: 'Bahan Lacoste CVC', variants: ['Navy', 'Hitam', 'Maroon'] },
  { name: 'Celana Chino Pendek', description: 'Bahan twill stretch elastis', variants: ['Khaki', 'Hitam', 'Mocca'] },
  { name: 'Celana Chino Panjang', description: 'Celana formal & kasual', variants: ['Hitam', 'Khaki', 'Navy', 'Abu-abu'] },
  { name: 'Celana Jogger Kasual', description: 'Bahan baby terry dengan tali', variants: ['Hitam', 'Abu-abu'] },
  { name: 'Celana Cargo Pendek', description: 'Multi-pocket outdoor twill', variants: ['Olive', 'Khaki', 'Hitam'] },
  { name: 'Celana Cargo Panjang', description: 'Cargo pants streetwear', variants: ['Hitam', 'Olive'] },
  { name: 'Celana Bahan Formal', description: 'Bahan semi-wool kantor', variants: ['Hitam', 'Abu-abu Tua'] },
  { name: 'Jaket Bomber Premium', description: 'Parasut taslan windbreaker', variants: ['Hitam', 'Navy', 'Olive'] },
  { name: 'Jaket Hoodie Jumper', description: 'Fleece tebal 280 gsm', variants: ['Hitam', 'Abu-abu', 'Navy'] },
  { name: 'Jaket Zip Hoodie', description: 'Fleece dengan resleting depan', variants: ['Hitam', 'Navy'] },
  { name: 'Jaket Coach Windbreaker', description: 'Outer streetwear kancing jepret', variants: ['Hitam', 'Maroon'] },
  { name: 'Rompi Vest Pria', description: 'Outer rajut / kanvas', variants: ['Hitam', 'Khaki'] },
  { name: 'Baju Koko Modern', description: 'Katun toyobo bordir minimalis', variants: ['Putih', 'Navy', 'Olive'] },
  { name: 'Outer Kimono / Noragi', description: 'Linen katun model jepang', variants: ['Hitam', 'Navy'] },
];

export const defaultFabrics = [
  { name: 'Kain Katun Putih', unit: 'meter', initialStock: 100 },
  { name: 'Kain Katun Hitam', unit: 'meter', initialStock: 90 },
  { name: 'Kain Katun Navy', unit: 'meter', initialStock: 75 },
  { name: 'Kain Chino Khaki', unit: 'meter', initialStock: 60 },
  { name: 'Kain Chino Hitam', unit: 'meter', initialStock: 70 },
  { name: 'Kain Denim Biru', unit: 'meter', initialStock: 50 },
  { name: 'Kain Baby Terry Abu-abu', unit: 'meter', initialStock: 65 },
  { name: 'Kain Parasut Taslan Hitam', unit: 'meter', initialStock: 45 },
  { name: 'Kain Fleece Hitam', unit: 'meter', initialStock: 55 },
  { name: 'Kain Toyobo Putih', unit: 'meter', initialStock: 40 },
];

export const defaultRawMaterials = [
  { name: 'Kancing Kemeja Putih', unit: 'pcs', initialStock: 1000 },
  { name: 'Kancing Kemeja Hitam', unit: 'pcs', initialStock: 800 },
  { name: 'Label Woven Brand', unit: 'pcs', initialStock: 2000 },
  { name: 'Resleting YKK 20cm', unit: 'pcs', initialStock: 300 },
  { name: 'Resleting Jaket YKK 60cm', unit: 'pcs', initialStock: 150 },
  { name: 'Karet Pinggang 3cm', unit: 'meter', initialStock: 200 },
  { name: 'Benang Jahit Putih', unit: 'roll', initialStock: 30 },
  { name: 'Benang Jahit Hitam', unit: 'roll', initialStock: 30 },
  { name: 'Tali Hoodie Katun', unit: 'meter', initialStock: 100 },
];

export const defaultChannels = [
  { name: 'Shopee' },
  { name: 'TikTok Shop' },
  { name: 'Website' },
  { name: 'Offline Store' },
  { name: 'WhatsApp / Chat' },
];

// DATA ACCESS SERVICES
export async function getDbArticles() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('articles').select('*, product_variants(*)').order('id');
  if (error) throw error;
  return data;
}

export async function getDbFabricStock() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('fabric_stock').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function getDbRawMaterials() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('raw_materials').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function getDbChannels() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('sales_channels').select('*').order('id');
  if (error) throw error;
  return data;
}

// 1-CLICK SEED SCRIPT FOR SUPABASE
export async function seedDatabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase URL & Anon Key belum diisi di .env.local');
  }

  const logs: string[] = [];

  // 1. Seed Channels
  for (const ch of defaultChannels) {
    await supabase.from('sales_channels').upsert({ name: ch.name }, { onConflict: 'name' });
  }
  logs.push(`✅ ${defaultChannels.length} Sales Channels seeded`);

  // 2. Seed Raw Materials
  for (const rm of defaultRawMaterials) {
    await supabase.from('raw_materials').upsert({ name: rm.name, unit: rm.unit, stock_qty: rm.initialStock }, { onConflict: 'name' });
  }
  logs.push(`✅ ${defaultRawMaterials.length} Bahan Baku seeded`);

  // 3. Seed Fabric Stocks
  for (const f of defaultFabrics) {
    await supabase.from('fabric_stock').upsert({ name: f.name, unit: f.unit, stock_qty: f.initialStock }, { onConflict: 'name' });
  }
  logs.push(`✅ ${defaultFabrics.length} Stok Kain seeded`);

  // 4. Seed 21 Articles & their Variants
  let totalVariants = 0;
  for (const a of default21Articles) {
    const { data: art, error: artErr } = await supabase
      .from('articles')
      .upsert({ name: a.name, description: a.description }, { onConflict: 'name' })
      .select()
      .single();

    if (!artErr && art) {
      for (const col of a.variants) {
        await supabase
          .from('product_variants')
          .upsert({ article_id: art.id, color: col, stock_qty: 30, stock_reject_qty: 2 }, { onConflict: 'article_id,color' });
        totalVariants++;
      }
    }
  }
  logs.push(`✅ ${default21Articles.length} Master Artikel & ${totalVariants} Varian Warna seeded`);

  return logs;
}
