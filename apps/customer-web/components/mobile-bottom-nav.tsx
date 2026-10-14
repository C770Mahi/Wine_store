'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AUTH_SESSION_EVENT, hasStoredSession } from '@/lib/auth';
import { CART_UPDATED_EVENT, getCart } from '@/lib/catalog';

function navClass(active: boolean) {
  return active
    ? 'border-brand/40 bg-brand-soft text-brand-dark shadow-sm'
    : 'border-transparent bg-transparent text-slate-500';
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const syncSession = () => setHasSession(hasStoredSession());
    const syncCart = async () => {
      try {
        const cart = await getCart();
        setCartCount(cart.items.reduce((count, item) => count + item.quantity, 0));
      } catch {
        setCartCount(0);
      }
    };

    syncSession();
    void syncCart();
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);
    window.addEventListener(CART_UPDATED_EVENT, syncCart);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
      <nav className="mx-auto grid max-w-2xl grid-cols-4 gap-2 rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_-10px_35px_rgba(15,23,42,0.08)]">
        <Link href="/" className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl border text-[11px] font-semibold transition ${navClass(pathname === '/')}`}>
          <span className="text-base">⌂</span>
          <span>Home</span>
        </Link>
        <Link href="/shop" className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl border text-[11px] font-semibold transition ${navClass(pathname.startsWith('/shop') || pathname.startsWith('/product/'))}`}>
          <span className="text-base">◫</span>
          <span>Shop</span>
        </Link>
        <Link href="/cart" className={`relative flex min-h-[56px] flex-col items-center justify-center rounded-2xl border text-[11px] font-semibold transition ${navClass(pathname.startsWith('/cart') || pathname.startsWith('/checkout'))}`}>
          <span className="text-base">🛒</span>
          <span>Cart</span>
          {cartCount ? <span className="absolute right-3 top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{cartCount > 99 ? '99+' : cartCount}</span> : null}
        </Link>
        <Link href={(hasSession ? '/account' : '/auth/login') as Route} className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl border text-[11px] font-semibold transition ${navClass(pathname.startsWith('/account') || pathname.startsWith('/auth'))}`}>
          <span className="text-base">◎</span>
          <span>Account</span>
        </Link>
      </nav>
    </div>
  );
}
