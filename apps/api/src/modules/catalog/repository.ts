import { dbQuery } from '../../db/client';

export interface ProductVariantRecord {
  id: string;
  inventoryId?: string;
  volumeMl: number;
  packType: string;
  label: string;
  mrp: number;
  salePrice: number;
  stockQty: number;
  inStock: boolean;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  shortDescription: string;
  longDescription: string;
  description: string;
  image: string;
  eta: string;
  createdAt: string;
  isNew: boolean;
  variants: ProductVariantRecord[];
}

export interface CategoryOptionRecord {
  id: string;
  name: string;
}

export interface BrandOptionRecord {
  id: string;
  name: string;
}

interface ProductFilters {
  category?: string;
  brand?: string;
  search?: string;
}

function formatVariantLabel(quantity: number, unit: string) {
  if (unit === 'g' && quantity >= 1000) {
    return `${quantity / 1000} kg`;
  }

  if (unit === 'ml' && quantity >= 1000) {
    return `${quantity / 1000} L`;
  }

  return `${quantity} ${unit}`;
}

function isRecentlyAdded(value: string) {
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) {
    return false;
  }

  return Date.now() - createdAt <= 1000 * 60 * 20;
}

function groupProductRows(rows: Array<Record<string, unknown>>): ProductRecord[] {
  const map = new Map<string, ProductRecord>();

  for (const row of rows) {
    const productId = String(row.product_id);
    const existing = map.get(productId) ?? {
      id: productId,
      slug: String(row.slug),
      name: String(row.product_name),
      brand: String(row.brand_name),
      category: String(row.category_name),
      rating: Number(row.rating_avg ?? 0),
      shortDescription: String(row.short_description ?? ''),
      longDescription: String(row.long_description ?? row.short_description ?? ''),
      description: String(row.short_description ?? row.long_description ?? ''),
      image: String(row.image_url ?? 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=80'),
      eta: '18 mins',
      createdAt: String(row.product_created_at ?? ''),
      isNew: isRecentlyAdded(String(row.product_created_at ?? '')),
      variants: []
    };

    if (row.variant_id) {
      existing.variants.push({
        id: String(row.variant_id),
        inventoryId: row.inventory_id ? String(row.inventory_id) : undefined,
        volumeMl: Number(row.volume_ml),
        packType: String(row.pack_type ?? 'ml'),
        label: formatVariantLabel(Number(row.volume_ml), String(row.pack_type ?? 'ml')),
        mrp: Number(row.mrp),
        salePrice: Number(row.sale_price),
        stockQty: Number(row.stock_qty ?? 0),
        inStock: Boolean(row.is_in_stock)
      });
    }

    map.set(productId, existing);
  }

  return Array.from(map.values());
}

export async function listCategoryOptions() {
  const { rows } = await dbQuery<CategoryOptionRecord>('SELECT id, name FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC');
  return rows;
}

export async function listCategories() {
  const rows = await listCategoryOptions();
  return rows.map((row) => row.name);
}

export async function listBrandOptions() {
  const { rows } = await dbQuery<BrandOptionRecord>('SELECT id, name FROM brands WHERE is_active = TRUE ORDER BY name ASC');
  return rows;
}

export async function listBrands() {
  const rows = await listBrandOptions();
  return rows.map((row) => row.name);
}

export async function listProducts(filters: ProductFilters = {}) {
  const clauses = ['p.is_active = TRUE'];
  const params: unknown[] = [];

  if (filters.category && filters.category !== 'All') {
    params.push(filters.category);
    clauses.push(`c.name = $${params.length}`);
  }

  if (filters.brand) {
    params.push(filters.brand);
    clauses.push(`b.name = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    clauses.push(`LOWER(p.name || ' ' || b.name || ' ' || c.name || ' ' || COALESCE(p.short_description, '') || ' ' || COALESCE(p.long_description, '')) LIKE $${params.length}`);
  }

  const { rows } = await dbQuery(
    `SELECT
        p.id AS product_id,
        p.slug,
        p.name AS product_name,
        p.short_description,
        p.long_description,
        p.rating_avg,
        p.created_at AS product_created_at,
        b.name AS brand_name,
        c.name AS category_name,
        pi.image_url,
        pv.id AS variant_id,
        i.id AS inventory_id,
        pv.volume_ml,
        pv.pack_type,
        pv.mrp,
        pv.sale_price,
        COALESCE(i.stock_qty, 0) AS stock_qty,
        COALESCE(i.is_in_stock, TRUE) AS is_in_stock
     FROM products p
     INNER JOIN brands b ON b.id = p.brand_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.sort_order = 0
     LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
     LEFT JOIN inventories i ON i.variant_id = pv.id
     WHERE ${clauses.join(' AND ')}
     ORDER BY p.created_at DESC, pv.volume_ml ASC`,
    params
  );

  return groupProductRows(rows as Array<Record<string, unknown>>);
}

export async function getProductBySlug(slug: string) {
  const products = await listProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getRelatedProducts(slug: string) {
  const current = await getProductBySlug(slug);
  if (!current) {
    return [];
  }

  const products = await listProducts({ category: current.category });
  return products.filter((product) => product.slug !== slug).slice(0, 4);
}
