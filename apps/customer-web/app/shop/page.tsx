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
  const activeCategory = searchParams?.category ?? '';
  const productsResponse = await getProducts({
    category: searchParams?.category,
    search: searchParams?.search,
    brand: searchParams?.brand
  });
  const products = sortProducts(productsResponse, sort);
  const heading = activeCategory || 'Shop';

  return (
    <main className="page-shell pb-16 pt-4 sm:pt-6">
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
    </main>
  );
}
