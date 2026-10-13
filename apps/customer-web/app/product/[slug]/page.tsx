import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { ProductCard } from '@/components/product-card';
import { formatCurrency, getProductBySlug, getRelatedProducts } from '@/lib/catalog';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(params.slug);

  return (
    <main className="page-shell pb-16 pt-6 sm:pt-8">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="card overflow-hidden">
          <img src={product.image} alt={product.name} className="min-h-[260px] w-full object-cover sm:min-h-[360px] lg:min-h-[420px]" />
        </div>
        <section className="card p-5 sm:p-8">
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-muted">
            <span className="chip">{product.category}</span>
            <span className="chip">{product.brand}</span>
            <span className="chip">⭐ {product.rating}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-base text-muted">{product.description}</p>

          <div className="mt-6 rounded-3xl bg-brand-soft p-4 sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-dark">Available packs</p>
            <div className="mt-4 grid gap-3 min-[390px]:grid-cols-2">
              {product.variants.map((variant) => (
                <div key={variant.id} className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="font-bold text-ink">{variant.label}</p>
                  <p className="mt-1 text-sm text-muted">MRP {formatCurrency(variant.mrp)}</p>
                  <p className="mt-2 text-xl font-extrabold text-ink">{formatCurrency(variant.salePrice)}</p>
                  <AddToCartButton variantId={variant.id} className="btn-primary mt-4 w-full" label="Add to cart" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 min-[390px]:grid-cols-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-muted">Delivery ETA</p>
              <p className="mt-1 font-bold text-ink">{product.eta}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-muted">Stock status</p>
              <p className="mt-1 font-bold text-ink">In stock</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-muted">Store support</p>
              <p className="mt-1 font-bold text-ink">Quick help available</p>
            </div>
          </div>
        </section>
      </div>

      {relatedProducts.length ? (
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Related products</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">You may also like</h2>
          </div>
          <div className="grid gap-5 min-[390px]:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
