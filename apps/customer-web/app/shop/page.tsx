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
  const [productsResponse, categories] = await Promise.all([
    getProducts({
      category: searchParams?.category,
      search: searchParams?.search,
      brand: searchParams?.brand
    }),
    getCategories()
  ]);
  const products = sortProducts(productsResponse, sort);
  const heading = activeCategory || 'Shop';

  return (
    <main className="page-shell pb-16 pt-4 sm:pt-6">
      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[104px_minmax(0,1fr)] lg:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="sticky top-20 self-start sm:top-24 lg:top-28">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-1.5 shadow-card sm:p-2 lg:rounded-3xl lg:p-4">
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand sm:text-[11px] lg:pb-3 lg:text-sm">Categories</p>
            <div className="flex flex-col gap-2">
              <Link href="/shop" className={`inline-flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-center text-[10px] font-semibold leading-4 transition sm:min-h-[64px] sm:text-[11px] lg:min-h-[46px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm lg:leading-5 ${activeCategory ? 'border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand' : 'border-brand bg-brand text-white shadow-sm'}`}>
                <span className={`text-base ${activeCategory ? 'text-slate-500 lg:text-slate-600' : 'text-brand-dark lg:text-white'}`}>◫</span>
                <span className="line-clamp-2 break-words lg:line-clamp-1">All</span>
              </Link>
              {categories.map((category) => {
                const isActive = activeCategory === category;
                const icon = categoryIcons[category] ?? '🛒';
                return (
                  <Link
                    key={category}
                    href={`/shop?category=${encodeURIComponent(category)}`}
                    className={`inline-flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-center text-[10px] font-semibold leading-4 transition sm:min-h-[64px] sm:text-[11px] lg:min-h-[46px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm lg:leading-5 ${isActive ? 'border-brand bg-brand text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand'}`}
                  >
                    <span className={`text-base ${isActive ? 'text-white' : 'text-slate-500 lg:text-brand-dark'}`}>{icon}</span>
                    <span className="line-clamp-2 break-words lg:line-clamp-1">{category}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <section className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-3 py-3 shadow-card sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-black tracking-tight text-ink sm:text-2xl">{heading}</h1>
              <p className="mt-1 text-sm text-muted">{products.length} products</p>
            </div>
            <Suspense fallback={<div className="chip w-full justify-center sm:w-auto">Sort: Newest first</div>}>
              <ShopSortControl value={sort} />
            </Suspense>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
