'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/customers', label: 'Customers' },
  { href: '/orders', label: 'Orders' },
  { href: '/products/add', label: 'Add Product' },
  { href: '/products', label: 'Manage Products' }
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Near Kart admin</p>
            <p className="mt-2 text-sm text-slate-400">Separate workspaces for dashboard, customers, orders, and products.</p>
          </div>
          <nav className="flex flex-wrap gap-3">
            {navigationItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-emerald-500 text-white' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
