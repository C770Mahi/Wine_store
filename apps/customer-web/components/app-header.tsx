'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, AUTH_SESSION_EVENT, getStoredUser } from '@/lib/auth';
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

  useEffect(() => {
    const syncState = async () => {
      const storedUser = getStoredUser();
      setUserName(storedUser?.name ?? '');

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
      <div className="page-shell pt-1 pb-4 pl-1 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link href="/" className="flex items-center gap-1">
              <Image src={nearKartLogo} alt="Near Kart" className="h-24 w-auto max-w-[340px] sm:h-28 sm:max-w-[440px] lg:max-w-[500px]" priority />
              <div className="hidden sm:block">
                <p className="text-base font-bold text-ink">Near Kart</p>
                <p className="text-xs text-muted">Neighbourhood store</p>
              </div>
            </Link>
            <div className="hidden rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-dark md:block">
              Grocery-style delivery in 10-25 mins
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 lg:max-w-2xl">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-400">🔎</span>
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search products, categories, offers" />
            </div>
            <Link href="/cart" className="btn-primary whitespace-nowrap px-4">
              Cart{cartCount ? ` (${cartCount})` : ''}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex gap-3 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const isActive = pathname === '/shop' && searchParams.get('category') === item.category;
              return (
                <Link
                  key={item.label}
                  href={{ pathname: '/shop' as Route, query: { category: item.category } }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600'}`}
                >
                  {item.label}
                </Link>
              );
            })}
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
