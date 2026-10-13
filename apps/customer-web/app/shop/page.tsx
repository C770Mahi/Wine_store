import { Suspense } from 'react';
import { ProductCard } from '@/components/product-card';
import { ShopSortControl } from '@/components/shop-sort-control';
import { Product, getProducts } from '@/lib/catalog';

interface ShopPageProps {
  searchParams?: {
    category?: string;
    search?: string;
    brand?: string;
    sort?: string;
  };
}

function getLowestSalePrice(product: Product) {
  return product.variants[0]?.salePrice ?? Number.MAX_SAFE_INTEGER;
}

function sortProducts(products: Product[], sort: string) {
  switch (sort) {
    case 'price-asc':
      return [...products].sort((left, right) => getLowestSalePrice(left) - getLowestSalePrice(right));
    case 'price-desc':
      return [...products].sort((left, right) => getLowestSalePrice(right) - getLowestSalePrice(left));
    case 'rating':
      return [...products].sort((left, right) => right.rating - left.rating);
    default:
      return products;
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sort = searchParams?.sort ?? 'newest';
  const products = sortProducts(await getProducts({
    category: searchParams?.category,
    search: searchParams?.search,
    brand: searchParams?.brand
  }), sort);

  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Product listing</p>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Browse Near Kart collections</h1>
        <p className="max-w-3xl text-sm text-muted">API-backed listing page with category search and fast neighbourhood shopping.</p>
      </div>

      <section>
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="font-semibold text-ink">{products.length} products available</p>
            <p className="text-sm text-muted">Connected to the Express API for real catalog responses.</p>
          </div>
          <Suspense fallback={<div className="chip">Sort: Newest first</div>}>
            <ShopSortControl value={sort} />
          </Suspense>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
