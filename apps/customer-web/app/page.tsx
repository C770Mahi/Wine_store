import Link from 'next/link';
import { CategoryRail } from '@/components/category-rail';
import { OfferBanner } from '@/components/offer-banner';
import { ProductCard } from '@/components/product-card';
import { getCategories, getProducts, offerBanners } from '@/lib/catalog';

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const featuredProducts = products.slice(0, 4);
  const bestSellingProducts = [...products].sort((left, right) => right.rating - left.rating).slice(0, 4);

  return (
    <main className="pb-16">
      <section className="page-shell pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="card overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">Alcohol delivery marketplace</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              Blinkit-style alcohol ordering experience for Bangalore.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-emerald-50/80">
              Search by brand, bottle size, price, and category. Discover fast-moving products, save addresses, pick slots, apply coupons, and track delivery in one modern storefront.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Shop now</Link>
              <Link href="/auth/signup" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">Create account</Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold">10-25m</p>
                <p className="text-sm text-white/70">Delivery promise UI</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold">21+/25+</p>
                <p className="text-sm text-white/70">Age gate by region</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold">OTP + JWT</p>
                <p className="text-sm text-white/70">Auth-ready architecture</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {offerBanners.slice(0, 2).map((offer) => (
              <OfferBanner key={offer.id} {...offer} />
            ))}
          </div>
        </div>
      </section>

      <CategoryRail categories={categories} />

      <section className="page-shell mt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Featured products</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Fast-moving shelf</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-brand">See all</Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="page-shell mt-10">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="card bg-accent/20 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-800">Coupons & offers</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">Discount banners built for conversion.</h2>
            <p className="mt-3 text-sm text-muted">Use this area for first-order discounts, premium shelf promos, Bangalore locality campaigns, and brand-funded offers.</p>
            <div className="mt-6 space-y-3">
              {offerBanners.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{offer.title}</p>
                      <p className="text-sm text-muted">{offer.subtitle}</p>
                    </div>
                    {offer.couponCode ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink">{offer.couponCode}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Best sellers</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Most reordered this week</h2>
              </div>
              <Link href="/shop" className="text-sm font-semibold text-brand">Open quick shop</Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {bestSellingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
