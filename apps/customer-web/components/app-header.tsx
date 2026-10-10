'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearSession, AUTH_SESSION_EVENT, getStoredUser } from '@/lib/auth';
import { CART_UPDATED_EVENT, getCart } from '@/lib/catalog';

const navItems = ['Beer', 'Whisky', 'Vodka', 'Rum', 'Wine', 'Brandy', 'Gin', 'Tequila', 'Mixers'];

export function AppHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const syncState = async () => {
      const user = getStoredUser();
      setUserName(user?.name ?? '');

      try {
        const cart = await getCart();
        setCartCount(cart.items.reduce((total, item) => total + item.quantity, 0));
      } catch {
        setCartCount(0);
      }
    };

    void syncState();
    window.addEventListener(CART_UPDATED_EVENT, syncState);
    window.addEventListener(AUTH_SESSION_EVENT, syncState);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncState);
      window.removeEventListener(AUTH_SESSION_EVENT, syncState);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="page-shell py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">IR</div>
              <div>
                <p className="text-lg font-extrabold text-ink">Indus Reserve</p>
                <p className="text-sm text-muted">Bangalore alcohol delivery</p>
              </div>
            </Link>
            <div className="hidden rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-dark md:block">
              Delivering in 10-25 mins
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 lg:max-w-2xl">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-400">🔎</span>
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search products, brands, sizes, offers" />
            </div>
            <Link href="/cart" className="btn-primary whitespace-nowrap px-4">
              Cart{cartCount ? ` (${cartCount})` : ''}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex gap-3 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link key={item} href={`/shop?category=${encodeURIComponent(item)}`} className="chip whitespace-nowrap">
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {userName ? (
              <>
                <span className="font-semibold text-ink">Hi, {userName}</span>
                <button type="button" className="chip" onClick={clearSession}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="font-semibold text-brand">Login</Link>
                <Link href="/auth/signup" className="chip">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
