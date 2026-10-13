import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { AppHeader } from '@/components/app-header';

export const metadata: Metadata = {
  title: 'Near Kart',
  description: 'Near Kart is a quick-commerce neighbourhood delivery storefront for everyday essentials.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <AppHeader />
        </Suspense>
        {children}
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="page-shell grid gap-8 py-10 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold text-ink">Near Kart</h3>
              <p className="mt-2 text-sm text-muted">Your neighbourhood store, online — built for fast discovery, OTP auth, cart, checkout, and instant local delivery experiences.</p>
            </div>
            <div>
              <h4 className="font-semibold text-ink">Coverage</h4>
              <p className="mt-2 text-sm text-muted">Indiranagar, Koramangala, Whitefield, HSR Layout, JP Nagar and selected Bangalore delivery zones.</p>
            </div>
            <div>
              <h4 className="font-semibold text-ink">Operations</h4>
              <p className="mt-2 text-sm text-muted">Pincode validation, OTP login, order orchestration, and delivery controls still need production service integrations.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
