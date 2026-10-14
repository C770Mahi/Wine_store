import Image from 'next/image';
import Link from 'next/link';
import { CategoryRail } from '@/components/category-rail';
import { DussehraBlessingOverlay } from '@/components/dussehra-blessing-overlay';
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

const categoryIcons: Record<string, string> = {
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Dairy & Bakery': '🥛',
  'Kitchen Items': '🍳',
  'Home Groceries': '🛍️',
  'Snacks & Drinks': '🥤',
  'Home Care': '🧴',
  'Cleaning Supplies': '🧼',
  'Daily Essentials': '⭐'
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
  const mobileQuickCategories = categorySections.slice(0, 5);
  const mobileFeatureCards = categorySections.slice(0, 3);
  const mobileCircleCollections = categorySections.slice(0, 6);
  const mobileProductHighlights = products.slice(0, 4);
  const featuredOffer = offerBanners[0];

  return (
    <main className="bg-gradient-to-b from-sky-50 via-white to-emerald-50 pb-16">
      <DussehraBlessingOverlay />
      <section className="page-shell pt-4 sm:hidden">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-sky-50 to-teal-50 p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-dark">Near Kart mobile</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">Fresh groceries with a cleaner mobile look.</h1>
          <p className="mt-3 text-sm text-slate-600">Open fast picks, browse useful collections, and jump into today&apos;s essentials without the heavy yellow theme.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/shop" className="btn-primary flex-1">Start shopping</Link>
            <Link href="/cart" className="btn-secondary flex-1">Open cart</Link>
          </div>
        </div>

        {mobileQuickCategories.length ? (
          <div className="mt-5 grid grid-cols-3 gap-3 min-[390px]:grid-cols-4 min-[480px]:grid-cols-5">
            {mobileQuickCategories.map((section) => (
              <Link key={section.category} href={`/shop?category=${encodeURIComponent(section.category)}`} className="flex min-h-[108px] flex-col items-center gap-2 rounded-3xl bg-white/80 px-2 py-3 text-center shadow-sm ring-1 ring-slate-100 backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-lg">{categoryIcons[section.category] ?? '🛒'}</div>
                <span className="line-clamp-2 text-[11px] font-semibold leading-4 text-slate-700">{section.category}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {mobileFeatureCards.length ? (
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {mobileFeatureCards.map((section) => (
              <Link key={section.category} href={`/shop?category=${encodeURIComponent(section.category)}`} className="min-w-[220px] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 shadow-card backdrop-blur">
                <div className="relative h-28 w-full">
                  <Image src={section.bannerImage} alt={section.category} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-slate-900/20 to-transparent" />
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{section.category}</p>
                  <p className="text-base font-bold text-ink">Quick picks ready to deliver</p>
                  <p className="line-clamp-2 text-sm text-muted">{section.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {featuredOffer ? (
          <article className="mt-6 rounded-[1.75rem] border border-brand/10 bg-white/85 p-4 shadow-card backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">Today&apos;s offer</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-ink">{featuredOffer.title}</h2>
                <p className="mt-1 text-sm text-muted">{featuredOffer.subtitle}</p>
              </div>
              {featuredOffer.couponCode ? <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">{featuredOffer.couponCode}</span> : null}
            </div>
          </article>
        ) : null}

        {mobileCircleCollections.length ? (
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Collections</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Trending on mobile</h2>
              </div>
              <Link href="/shop" className="text-sm font-semibold text-brand">See all</Link>
            </div>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {mobileCircleCollections.map((section) => (
                <Link key={section.category} href={`/shop?category=${encodeURIComponent(section.category)}`} className="flex min-w-[80px] flex-col items-center gap-2 text-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-card">
                    <Image src={section.bannerImage} alt={section.category} fill className="object-cover" />
                  </div>
                  <span className="text-xs font-semibold leading-4 text-slate-700">{section.category}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {mobileProductHighlights.length ? (
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Quick basket</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Everyday favourites</h2>
              </div>
              <Link href="/shop" className="text-sm font-semibold text-brand">Browse</Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
              {mobileProductHighlights.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Link href="/shop" className="mt-5 flex items-center justify-center rounded-3xl bg-white/85 px-4 py-4 text-sm font-semibold text-brand shadow-card backdrop-blur">
              See all products
            </Link>
          </section>
        ) : null}
      </section>

      <div className="hidden sm:block">
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
          <div className="card bg-gradient-to-br from-brand-soft via-white to-sky-100 p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-dark">Coupons & offers</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">Discount banners built for everyday baskets.</h2>
            <p className="mt-3 text-sm text-muted">Use this area for first-order discounts, locality campaigns, bundle offers, and partner-funded promos.</p>
            <div className="mt-6 space-y-3">
              {offerBanners.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-brand/10 bg-white/90 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <p className="font-semibold text-ink">{offer.title}</p>
                      <p className="text-sm text-muted">{offer.subtitle}</p>
                    </div>
                    {offer.couponCode ? <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">{offer.couponCode}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
