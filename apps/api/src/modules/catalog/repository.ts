import { dbQuery } from '../../db/client';

export interface ProductVariantRecord {
  id: string;
  volumeMl: number;
  label: string;
  mrp: number;
  salePrice: number;
  inStock: boolean;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  description: string;
  image: string;
  eta: string;
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
      description: String(row.short_description ?? row.long_description ?? ''),
      image: String(row.image_url ?? 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=80'),
      eta: '18 mins',
      variants: []
    };

    if (row.variant_id) {
      existing.variants.push({
        id: String(row.variant_id),
        volumeMl: Number(row.volume_ml),
        label: formatVariantLabel(Number(row.volume_ml), String(row.pack_type ?? 'ml')),
        mrp: Number(row.mrp),
        salePrice: Number(row.sale_price),
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
    clauses.push(`LOWER(p.name || ' ' || b.name || ' ' || c.name) LIKE $${params.length}`);
  }

  const { rows } = await dbQuery(
    `SELECT
        p.id AS product_id,
        p.slug,
        p.name AS product_name,
        p.short_description,
        p.long_description,
        p.rating_avg,
        b.name AS brand_name,
        c.name AS category_name,
        pi.image_url,
        pv.id AS variant_id,
        pv.volume_ml,
        pv.pack_type,
        pv.mrp,
        pv.sale_price,
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
