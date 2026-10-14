'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  applyCouponRequest,
  CartData,
  formatCurrency,
  getCart,
  removeCartItemRequest,
  removeCouponRequest,
  updateCartItemRequest
} from '@/lib/catalog';

interface CartPageClientProps {
  initialCart?: CartData;
}

const emptyCart: CartData = {
  id: 'cart-empty',
  userId: 'guest',
  items: [],
  summary: {
    subtotal: 0,
    discount: 0,
    tax: 0,
    delivery: 0,
    payable: 0
  }
};

export function CartPageClient({ initialCart = emptyCart }: CartPageClientProps) {
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState(initialCart.coupon?.code ?? '');
  const [loadingItemId, setLoadingItemId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const hydrateCart = async () => {
      try {
        const nextCart = await getCart();
        setCart(nextCart);
        setCouponCode(nextCart.coupon?.code ?? '');
      } catch {
        setCart(emptyCart);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrateCart();
  }, []);

  const mutateCart = async (action: () => Promise<CartData>, successMessage: string, itemId?: string) => {
    setLoadingItemId(itemId ?? 'global');
    setMessage('');
    setError('');

    try {
      const nextCart = await action();
      setCart(nextCart);
      setCouponCode(nextCart.coupon?.code ?? '');
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart update failed.');
    } finally {
      setLoadingItemId('');
    }
  };

  const handleCouponSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!couponCode.trim()) {
      return;
    }

    await mutateCart(() => applyCouponRequest(couponCode.trim()), 'Coupon applied.');
  };

  if (isLoading) {
    return <div className="card p-6 text-center text-sm text-muted sm:p-8">Loading your cart...</div>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="space-y-3">
        {cart.items.length ? cart.items.map((item) => (
          <article key={item.id} className="card p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 sm:h-16 sm:w-16">
                {item.image ? (
                  <img src={item.image} alt={item.productName} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg text-slate-400">🛍️</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-sm font-bold text-ink sm:text-base">{item.productName}</h2>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 px-1.5 py-1">
                    <button type="button" className="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-ink" onClick={() => mutateCart(() => updateCartItemRequest(item.id, Math.max(1, item.quantity - 1)), 'Cart updated.', item.id)} disabled={loadingItemId === item.id || item.quantity <= 1}>-</button>
                    <span className="min-w-6 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                    <button type="button" className="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-ink" onClick={() => mutateCart(() => updateCartItemRequest(item.id, item.quantity + 1), 'Cart updated.', item.id)} disabled={loadingItemId === item.id}>+</button>
                  </div>
                  <p className="text-sm font-extrabold text-ink sm:text-base">{formatCurrency(item.unitPrice * item.quantity)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>{formatCurrency(item.unitPrice)} each</span>
                  <button type="button" className="font-semibold text-brand" onClick={() => mutateCart(() => removeCartItemRequest(item.id), 'Item removed.', item.id)} disabled={loadingItemId === item.id}>Remove</button>
                </div>
              </div>
            </div>
          </article>
        )) : (
          <article className="card p-6 text-center sm:p-8">
            <h2 className="text-2xl font-bold text-ink">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted">Add a few essentials from the catalog to continue to checkout.</p>
            <Link href="/shop" className="btn-primary mt-5 min-h-[44px]">Browse catalog</Link>
          </article>
        )}
      </section>

      <aside className="card h-fit p-4 sm:p-5 lg:sticky lg:top-28">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Cart summary</h2>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={handleCouponSubmit}>
          <input className="min-h-[42px] flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Enter coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
          <button className="btn-secondary min-h-[42px] px-4 py-2.5 text-sm" disabled={loadingItemId === 'global'}>Apply</button>
        </form>
        {cart.coupon ? <button type="button" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand" onClick={() => mutateCart(() => removeCouponRequest(), 'Coupon removed.')}>Remove coupon</button> : null}
        {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
          Coupon code: <span className="font-semibold text-ink">{cart.coupon?.code ?? 'No coupon'}</span>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4"><span>Items total</span><span>{formatCurrency(cart.summary.subtotal)}</span></div>
          <div className="flex items-center justify-between gap-4"><span>Discount</span><span className="text-brand">-{formatCurrency(cart.summary.discount)}</span></div>
          <div className="flex items-center justify-between gap-4"><span>Taxes</span><span>{formatCurrency(cart.summary.tax)}</span></div>
          <div className="flex items-center justify-between gap-4"><span>Delivery</span><span>{formatCurrency(cart.summary.delivery)}</span></div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-base font-bold text-ink"><span>Total</span><span>{formatCurrency(cart.summary.payable)}</span></div>
        </div>
        <Link href="/checkout" className="btn-primary mt-6 block min-h-[44px] w-full text-center">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
