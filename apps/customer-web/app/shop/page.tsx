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
  const searchQuery = searchParams?.search?.trim() ?? '';
  const [productsResponse, categories] = await Promise.all([
    getProducts({
      category: searchParams?.category,
      search: searchParams?.search,
      brand: searchParams?.brand
    }),
    getCategories()
  ]);
  const products = sortProducts(productsResponse, sort);
  const title = activeCategory ? activeCategory : 'Browse Near Kart collections';
  const subtitle = activeCategory
    ? `Fresh picks, quick delivery, and mobile-friendly browsing for ${activeCategory.toLowerCase()}.`
    : 'API-backed listing page with category search and fast neighbourhood shopping.';

  return (
    <main className="page-shell pb-16 pt-4 sm:pt-8">
      <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-4 shadow-card sm:mb-8 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Product listing</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/90 px-3 py-2 font-semibold text-ink shadow-sm ring-1 ring-slate-100">{products.length} items</span>
            {searchQuery ? <span className="rounded-full bg-brand-soft px-3 py-2 font-semibold text-brand-dark">Search: {searchQuery}</span> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-4 sm:p-5 lg:sticky lg:top-28">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Categories</p>
          <div className="category-filter-grid">
            <Link href="/shop" className={`inline-flex min-h-[48px] min-w-0 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold leading-5 transition ${activeCategory ? 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand' : 'border border-brand bg-brand text-white shadow-sm'}`}>
              All categories
            </Link>
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <Link
                  key={category}
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className={`inline-flex min-h-[48px] min-w-0 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-semibold leading-5 transition ${isActive ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand'}`}
                >
                  <span className="line-clamp-2 break-words">{category}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <section>
          <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="font-semibold text-ink">{products.length} products available</p>
              <p className="text-sm text-muted">Optimized for mobile, tablet, and desktop browsing across all categories.</p>
            </div>
            <Suspense fallback={<div className="chip">Sort: Newest first</div>}>
              <ShopSortControl value={sort} />
            </Suspense>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
