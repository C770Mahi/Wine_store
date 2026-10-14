'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clearSession, AUTH_SESSION_EVENT, getStoredUser, hasStoredSession } from '@/lib/auth';
import { CART_UPDATED_EVENT, formatCurrency, getCart } from '@/lib/catalog';
import type { Product } from '@/lib/catalog';
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
  const [userMobile, setUserMobile] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchParamKey = searchParams.toString();
  const isShopPage = pathname === '/shop';

  useEffect(() => {
    const syncState = async () => {
      const storedUser = getStoredUser();
      setHasSession(hasStoredSession());
      setUserName(storedUser?.name ?? '');
      setUserMobile(storedUser?.mobile ?? '');
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

  useEffect(() => {
    const query = searchQuery.trim().replace(/\s+/g, ' ');
    if (!query) {
      setSearchResults([]);
      setSearchError('');
      setIsSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchLoading(true);
    setSearchError('');

    void fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ message: 'Unable to search products right now.' }));
          throw new Error(payload.message || 'Unable to search products right now.');
        }

        return response.json() as Promise<Product[]>;
      })
      .then((products) => {
        setSearchResults(products);
        setIsSearchLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setSearchResults([]);
        setSearchError(error instanceof Error ? error.message : 'Unable to search products right now.');
        setIsSearchLoading(false);
      });

    return () => controller.abort();
  }, [searchQuery]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname, searchParamKey]);

  const normalizedSearchQuery = searchQuery.trim().replace(/\s+/g, ' ');
  const showSearchPanel = isSearchOpen && normalizedSearchQuery.length > 0;

  const authControls = !authReady || hasSession
    ? null
    : (
        <>
          <Link href="/auth/login" className="inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2 font-semibold text-brand transition hover:bg-brand-soft/60">Login</Link>
          <Link href="/auth/signup" className="chip w-full sm:w-auto">Sign up</Link>
        </>
      );

  const profileControls = !authReady || !hasSession
    ? null
    : (
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <Link href="/account" className="flex min-w-0 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-brand/40 hover:shadow-card sm:max-w-[280px]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {(userName.trim().charAt(0) || 'U').toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-ink">{userName || 'Customer profile'}</p>
              <p className="truncate text-xs text-muted">{userMobile || 'Open account'}</p>
            </div>
          </Link>
          <button type="button" className="chip w-full shrink-0 sm:w-auto" onClick={clearSession}>Logout</button>
        </div>
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

          <div className="flex w-full flex-col gap-3 lg:max-w-3xl lg:justify-end">
            <div ref={searchContainerRef} className="relative w-full">
              <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                <span className="text-slate-400">🔎</span>
                <input
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full bg-transparent text-base outline-none sm:text-sm"
                  placeholder="Search products, categories, offers"
                />
              </div>

              {showSearchPanel ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-40 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
                  <div className="max-h-[60vh] overflow-y-auto p-3 sm:max-h-[28rem] sm:p-4">
                    {isSearchLoading ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-muted">Searching...</div>
                    ) : searchError ? (
                      <div className="rounded-2xl bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">{searchError}</div>
                    ) : searchResults.length ? (
                      <div className="space-y-3">
                        {searchResults.map((product) => {
                          const lowestVariant = product.variants[0];
                          return (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              className="flex gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-brand/30 hover:bg-slate-50"
                              onClick={() => setIsSearchOpen(false)}
                            >
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-ink">{product.name}</p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">{product.category}</p>
                                  </div>
                                  <span className="shrink-0 text-xs font-semibold text-muted">{product.eta}</span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm text-muted">{product.description}</p>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <span className="text-sm font-extrabold text-ink">{lowestVariant ? formatCurrency(lowestVariant.salePrice) : '—'}</span>
                                  <span className="truncate text-xs text-muted">{product.brand}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        <Link
                          href={`/shop?search=${encodeURIComponent(normalizedSearchQuery)}`}
                          className="flex min-h-[44px] items-center justify-center rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-dark"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          View all results
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-muted">No results found</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Link href="/cart" className="btn-primary justify-center whitespace-nowrap px-4">
                Cart{cartCount ? ` (${cartCount})` : ''}
              </Link>
              {profileControls}
            </div>
          </div>
        </div>

        <div className="mt-4 hidden lg:block">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:p-0">
            {isShopPage ? null : (
              <nav className="grid gap-2 sm:grid-cols-2 lg:flex lg:gap-2 lg:overflow-x-auto lg:pb-1 lg:pr-1">
                {navItems.map((item) => {
                  const isActive = pathname === '/shop' && searchParams.get('category') === item.category;
                  return (
                    <Link
                      key={item.label}
                      href={{ pathname: '/shop' as Route, query: { category: item.category } }}
                      className={`inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-center text-xs font-semibold transition sm:px-4 sm:text-sm ${isActive ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600'}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="hidden min-h-10 flex-wrap items-center gap-2 text-sm sm:gap-3 lg:flex">
              {authControls}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
