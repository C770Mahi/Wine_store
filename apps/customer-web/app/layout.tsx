import type { Metadata } from 'next';
import './globals.css';
import { AppHeader } from '@/components/app-header';

export const metadata: Metadata = {
  title: 'Indus Reserve',
  description: 'Quick-commerce alcohol delivery platform starter for Bangalore.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        {children}
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="page-shell grid gap-8 py-10 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold text-ink">Indus Reserve</h3>
              <p className="mt-2 text-sm text-muted">A starter storefront for Bangalore alcohol delivery with categories, offers, auth scaffolding, cart, checkout, and admin-ready architecture.</p>
            </div>
            <div>
              <h4 className="font-semibold text-ink">Coverage</h4>
              <p className="mt-2 text-sm text-muted">Indiranagar, Koramangala, Whitefield, HSR Layout, JP Nagar and selected Bangalore delivery zones.</p>
            </div>
            <div>
              <h4 className="font-semibold text-ink">Compliance</h4>
              <p className="mt-2 text-sm text-muted">Age verification, pincode validation, OTP login and delivery controls must be wired to real services before production.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
