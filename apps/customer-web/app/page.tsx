import Image from 'next/image';
import Link from 'next/link';
import { CategoryRail } from '@/components/category-rail';
import { OfferBanner } from '@/components/offer-banner';
import { ProductCard } from '@/components/product-card';
import { getCategories, getProducts, offerBanners } from '@/lib/catalog';

const categorySectionMeta: Record<string, { bannerImage: string; subtitle: string }> = {
  'Vegetables': {
    bannerImage: '/catalog/carrot.jpg',
    subtitle: 'Fresh vegetables for curries, salads, and daily kitchen needs.'
  },
  'Fruits': {
    bannerImage: '/catalog/banana-robusta.jpg',
    subtitle: 'Sweet and ready-to-eat fruits for snacking and breakfast baskets.'
  },
  'Dairy & Bakery': {
    bannerImage: '/catalog/daily-fresh-toned-milk.jpg',
    subtitle: 'Milk and everyday breakfast staples for quick home replenishment.'
  },
  'Kitchen Items': {
    bannerImage: '/catalog/fortune-sunlite-sunflower-oil.jpg',
    subtitle: 'Core cooking items for regular meal preparation and pantry use.'
  },
  'Home Groceries': {
    bannerImage: '/catalog/aashirvaad-whole-wheat-atta.jpg',
    subtitle: 'Monthly grocery staples and pantry essentials for every household.'
  },
  'Cleaning Supplies': {
    bannerImage: '/catalog/vim-dishwash-liquid.jpg',
    subtitle: 'Cleaning essentials to keep your kitchen and home ready every day.'
  }
};

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const categorySections = categories
    .map((category) => {
      const sectionProducts = products.filter((product) => product.category === category);
      const meta = categorySectionMeta[category];
      return {
        category,
        products: sectionProducts,
        previewProducts: sectionProducts.slice(0, 4),
        bannerImage: meta?.bannerImage ?? sectionProducts[0]?.image ?? '/catalog/preview-add-test-product.jpg',
        subtitle: meta?.subtitle ?? `Fast delivery picks from the ${category.toLowerCase()} collection.`
      };
    })
    .filter((section) => section.products.length > 0);

  return (
    <main className="pb-16">
      <section className="page-shell pt-6 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="card overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 p-5 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 sm:text-sm">Near Kart quick-commerce</p>
            <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              Blinkit-style neighbourhood shopping for fast local delivery.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-cyan-50/80 sm:text-base">
              Explore trending products, save addresses, choose delivery slots, apply offers, and reorder daily needs from one modern instant-delivery storefront.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/shop" className="btn-primary w-full sm:w-auto">Shop now</Link>
              <Link href="/auth/signup" className="btn-secondary w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto">Create account</Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold">10-25m</p>
                <p className="text-sm text-white/70">Delivery promise UI</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold">Top deals</p>
                <p className="text-sm text-white/70">Local offers & savings</p>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Shop by category</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">Separate sections for every collection</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-brand">Open full catalog</Link>
        </div>
      </section>

      <section className="page-shell mt-8 space-y-10">
        {categorySections.map((section) => (
          <div key={section.category} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
            <div className="relative h-56 w-full overflow-hidden sm:h-48">
              <Image src={section.bannerImage} alt={section.category} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-slate-900/20" />
              <div className="absolute inset-0 flex flex-col justify-end gap-4 p-4 text-white sm:flex-row sm:items-end sm:justify-between sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 sm:text-sm">{section.category}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Only {section.category.toLowerCase()}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/80">{section.subtitle}</p>
                </div>
                <Link href={`/shop?category=${encodeURIComponent(section.category)}`} className="self-start rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 sm:self-auto">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {section.previewProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="page-shell mt-10">
        <div className="card bg-accent/20 p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-800">Coupons & offers</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">Discount banners built for everyday baskets.</h2>
          <p className="mt-3 text-sm text-muted">Use this area for first-order discounts, locality campaigns, bundle offers, and partner-funded promos.</p>
          <div className="mt-6 space-y-3">
            {offerBanners.map((offer) => (
              <div key={offer.id} className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
      </section>
    </main>
  );
}
