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

      <div className="grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3 min-[375px]:grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[108px_minmax(0,1fr)] lg:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="card sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto p-2 sm:top-24 sm:p-3 lg:p-5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand lg:px-0 lg:text-sm">Categories</p>
          <div className="category-filter-grid">
            <Link href="/shop" className={`inline-flex min-h-[74px] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-center text-[11px] font-semibold leading-4 transition lg:min-h-[48px] lg:flex-row lg:justify-start lg:px-4 lg:text-sm lg:leading-5 ${activeCategory ? 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand' : 'border border-brand bg-brand text-white shadow-sm'}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-2xl text-sm lg:h-9 lg:w-9 lg:text-base ${activeCategory ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white'}`}>◫</span>
              <span className="line-clamp-2 break-words lg:line-clamp-1">All</span>
            </Link>
            {categories.map((category) => {
              const isActive = activeCategory === category;
              const icon = categoryIcons[category] ?? '🛒';
              return (
                <Link
                  key={category}
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className={`inline-flex min-h-[74px] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-center text-[11px] font-semibold leading-4 transition lg:min-h-[48px] lg:flex-row lg:justify-start lg:px-4 lg:text-sm lg:leading-5 ${isActive ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand'}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-sm lg:h-9 lg:w-9 lg:text-base ${isActive ? 'bg-white/20 text-white' : 'bg-brand-soft text-brand-dark'}`}>{icon}</span>
                  <span className="line-clamp-2 break-words lg:line-clamp-1">{category}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0">
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
