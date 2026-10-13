import { FilterSidebar } from '@/components/filter-sidebar';
import { ProductCard } from '@/components/product-card';
import { buildFilterGroups, getBrands, getProducts } from '@/lib/catalog';

interface ShopPageProps {
  searchParams?: {
    category?: string;
    search?: string;
    brand?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [products, brands] = await Promise.all([
    getProducts({
      category: searchParams?.category,
      search: searchParams?.search,
      brand: searchParams?.brand
    }),
    getBrands()
  ]);

  const filterGroups = buildFilterGroups(products, brands);

  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Product listing</p>
        <h1 className="text-4xl font-black tracking-tight text-ink">Browse Near Kart collections</h1>
        <p className="max-w-3xl text-sm text-muted">API-backed listing page with category, brand, search, and filter scaffolding for fast neighbourhood shopping.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <FilterSidebar brands={filterGroups.brands} volumes={filterGroups.volumes} priceBands={filterGroups.priceBands} />
        <section>
          <div className="mb-5 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-card">
            <div>
              <p className="font-semibold text-ink">{products.length} products available</p>
              <p className="text-sm text-muted">Connected to the Express API for real catalog responses.</p>
            </div>
            <div className="chip">Sort: Popularity</div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
