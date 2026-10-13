'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/customers', label: 'Customers' },
  { href: '/orders', label: 'Orders' },
  { href: '/products/add', label: 'Add Product' },
  { href: '/products', label: 'Manage Products' },
  { href: '/categories', label: 'Manage Categories' }
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  if (href === '/products') {
    return pathname === '/products';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Near Kart admin</p>
              <p className="mt-2 text-sm text-slate-400">Separate workspaces for dashboard, customers, orders, products, and categories.</p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-white md:hidden"
              aria-label={isMenuOpen ? 'Close admin navigation' : 'Open admin navigation'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
          <nav className={`${isMenuOpen ? 'grid' : 'hidden'} gap-3 md:flex md:flex-wrap`}>
            {navigationItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition md:justify-start ${active ? 'bg-emerald-500 text-white' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
