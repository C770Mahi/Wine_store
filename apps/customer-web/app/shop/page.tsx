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

const categoryIcons: Record<string, string> = {
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Dairy & Bakery': '🥛',
  'Kitchen Items': '🍳',
  'Home Groceries': '🛍️',
  'Snacks & Drinks': '🥤',
  'Home Care': '🧴',
  'Cleaning Supplies': '🧼',
  'Daily Essentials': '⭐',
  'Beverages': '🥤',
  'Dairy': '🥛',
  'Electronics': '🔌',
  'Snacks': '🍪',
  'Personal Care': '🧴',
  'Household': '🏠'
};

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
      <div className="mb-4 overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-4 shadow-card sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Product listing</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/90 px-3 py-2 font-semibold text-ink shadow-sm ring-1 ring-slate-100">{products.length} items</span>
            {searchQuery ? <span className="max-w-full truncate rounded-full bg-brand-soft px-3 py-2 font-semibold text-brand-dark sm:max-w-[220px]">Search: {searchQuery}</span> : null}
          </div>
        </div>
      </div>

      <div className="grid h-[calc(100dvh-11.5rem)] grid-cols-[78px_minmax(0,1fr)] items-start gap-3 overflow-hidden min-[375px]:grid-cols-[88px_minmax(0,1fr)] sm:h-[calc(100dvh-12rem)] sm:grid-cols-[104px_minmax(0,1fr)] lg:h-auto lg:gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:overflow-visible">
        <aside className="sticky top-20 h-[calc(100dvh-11.5rem)] overflow-y-auto overscroll-contain px-1 py-1 sm:top-24 sm:h-[calc(100dvh-12rem)] sm:px-2 lg:top-28 lg:h-auto lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:p-5 lg:shadow-card">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand lg:px-0 lg:text-sm">Categories</p>
          <div className="category-filter-grid">
            <Link href="/shop" className={`inline-flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center text-[10px] font-semibold leading-4 transition lg:min-h-[48px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm lg:leading-5 ${activeCategory ? 'bg-slate-50 text-slate-600 lg:border lg:border-slate-200 lg:bg-white lg:hover:border-brand/40 lg:hover:text-brand' : 'bg-brand-soft/80 text-brand-dark lg:border lg:border-brand lg:bg-brand lg:text-white lg:shadow-sm'}`}>
              <span className={`text-base lg:text-base ${activeCategory ? 'text-slate-500 lg:text-slate-600' : 'text-brand-dark lg:text-white'}`}>◫</span>
              <span className="line-clamp-2 break-words lg:line-clamp-1">All</span>
            </Link>
            {categories.map((category) => {
              const isActive = activeCategory === category;
              const icon = categoryIcons[category] ?? '🛒';
              return (
                <Link
                  key={category}
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className={`inline-flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center text-[10px] font-semibold leading-4 transition lg:min-h-[48px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm lg:leading-5 ${isActive ? 'bg-brand-soft/80 text-brand-dark lg:border lg:border-brand lg:bg-brand lg:text-white lg:shadow-sm' : 'text-slate-600 hover:bg-slate-100/70 hover:text-brand-dark lg:border lg:border-slate-200 lg:bg-white lg:hover:border-brand/40 lg:hover:text-brand'}`}
                >
                  <span className={`text-base lg:text-base ${isActive ? 'text-brand-dark lg:text-white' : 'text-slate-500 lg:text-brand-dark'}`}>{icon}</span>
                  <span className="line-clamp-2 break-words lg:line-clamp-1">{category}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 overflow-y-auto overscroll-contain pr-1">
          <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-3 py-3 shadow-card sm:px-5 sm:py-4">
            <div>
              <p className="font-semibold text-ink">{products.length} products available</p>
              <p className="text-sm text-muted">Optimized for mobile, tablet, and desktop browsing across all categories.</p>
            </div>
            <Suspense fallback={<div className="chip w-full justify-center sm:w-auto">Sort: Newest first</div>}>
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
