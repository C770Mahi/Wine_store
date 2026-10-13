'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, AUTH_SESSION_EVENT, getStoredUser, hasStoredSession } from '@/lib/auth';
import { CART_UPDATED_EVENT, getCart } from '@/lib/catalog';
import nearKartLogo from '../../../{EXTERNAL}_Logos/IMG_0808.png';

const navItems = [
  { label: 'Vegetables', category: 'Vegetables' },
  { label: 'Fruits', category: 'Fruits' },
  { label: 'Dairy & Bakery', category: 'Dairy & Bakery' },
  { label: 'Kitchen Items', category: 'Kitchen Items' },
  { label: 'Home Groceries', category: 'Home Groceries' },
  { label: 'Snacks & Drinks', category: 'Snacks & Drinks' },
  { label: 'Home Care', category: 'Home Care' },
  { label: 'Cleaning Supplies', category: 'Cleaning Supplies' },
  { label: 'Daily Essentials', category: 'Daily Essentials' }
] satisfies Array<{ label: string; category: string }>;

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const isShopPage = pathname === '/shop';

  useEffect(() => {
    const syncState = async () => {
      const storedUser = getStoredUser();
      setHasSession(hasStoredSession());
      setUserName(storedUser?.name ?? '');
      setAuthReady(true);

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

  const authControls = !authReady
    ? null
    : hasSession
      ? (
          <>
            {userName ? <span className="max-w-[180px] truncate font-semibold text-ink">Hi, {userName}</span> : null}
            <button type="button" className="chip" onClick={clearSession}>Logout</button>
          </>
        )
      : (
          <>
            <Link href="/auth/login" className="font-semibold text-brand">Login</Link>
            <Link href="/auth/signup" className="chip">Sign up</Link>
          </>
        );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="page-shell pb-3 pt-2 sm:pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <Link href="/" className="flex items-center gap-2 self-start">
              <Image src={nearKartLogo} alt="Near Kart" className="h-16 w-auto max-w-[180px] sm:h-24 sm:max-w-[340px] lg:h-28 lg:max-w-[440px]" priority />
              <div className="hidden sm:block">
                <p className="text-base font-bold text-ink">Near Kart</p>
                <p className="text-xs text-muted">Neighbourhood store</p>
              </div>
            </Link>
            <div className="hidden rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-dark md:block">
              Grocery-style delivery in 10-25 mins
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-2xl">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
              <span className="text-slate-400">🔎</span>
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search products, categories, offers" />
            </div>
            <Link href="/cart" className="btn-primary w-full justify-center whitespace-nowrap px-4 sm:w-auto">
              Cart{cartCount ? ` (${cartCount})` : ''}
            </Link>
          </div>
        </div>

        {isShopPage ? null : (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex gap-2 overflow-x-auto pb-1 pr-1">
              {navItems.map((item) => {
                const isActive = pathname === '/shop' && searchParams.get('category') === item.category;
                return (
                  <Link
                    key={item.label}
                    href={{ pathname: '/shop' as Route, query: { category: item.category } }}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${isActive ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex min-h-10 flex-wrap items-center gap-2 text-sm sm:gap-3">
              {authControls}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
