import Link from 'next/link';
import { Suspense } from 'react';
import { ProductCard } from '@/components/product-card';
import { ShopSortControl } from '@/components/shop-sort-control';
import { Product, getCategories, getProducts } from '@/lib/catalog';

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
  const activeCategory = searchParams?.category ?? '';
  const [productsResponse, categories] = await Promise.all([
    getProducts({
      category: searchParams?.category,
      search: searchParams?.search,
      brand: searchParams?.brand
    }),
    getCategories()
  ]);
  const products = sortProducts(productsResponse, sort);

  return (
    <main className="page-shell pb-16 pt-6 sm:pt-8">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Product listing</p>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Browse Near Kart collections</h1>
        <p className="max-w-3xl text-sm text-muted">API-backed listing page with category search and fast neighbourhood shopping.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-4 sm:p-5 lg:sticky lg:top-28">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Categories</p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <Link href="/shop" className={`inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeCategory ? 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand' : 'border border-brand bg-brand text-white shadow-sm'}`}>
              All categories
            </Link>
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <Link
                  key={category}
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className={`inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand'}`}
                >
                  {category}
                </Link>
              );
            })}
          </div>
        </aside>

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
          <div className="grid gap-5 min-[390px]:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
