import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { AppHeader } from '@/components/app-header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

export const metadata: Metadata = {
  title: 'Near Kart',
  description: 'Near Kart is a quick-commerce neighbourhood delivery storefront for everyday essentials.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pb-24 md:pb-0">
        <Suspense fallback={null}>
          <AppHeader />
        </Suspense>
        {children}
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="page-shell py-6 sm:py-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink sm:text-lg">Near Kart</h3>
                  <p className="text-xs text-muted sm:text-sm">Your neighbourhood store, online — built for fast ordering, quick delivery, and smooth mobile checkout.</p>
                </div>
                <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-dark shadow-sm ring-1 ring-slate-100 sm:self-auto">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                  Bangalore quick-commerce coverage
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <article className="rounded-2xl bg-gradient-to-r from-brand-soft via-white to-amber-50 p-4 ring-1 ring-brand/10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm motion-safe:animate-pulse">🚚</div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-dark">Featured</p>
                      <h4 className="text-sm font-bold text-ink sm:text-base">Delivery in 15 Minutes</h4>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted">Fast & Reliable Delivery at Your Doorstep</p>
                </article>
                <div className="grid gap-3 md:grid-cols-2">
                  <article className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Coverage</p>
                    <p className="mt-2 text-sm font-semibold text-ink">Indiranagar, Koramangala, Whitefield, HSR Layout, JP Nagar and nearby delivery zones.</p>
                  </article>
                  <article className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Operations</p>
                    <p className="mt-2 text-sm font-semibold text-ink">Pincode checks, OTP login, delivery orchestration, and reliable order handling.</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </footer>
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      </body>
    </html>
  );
}
