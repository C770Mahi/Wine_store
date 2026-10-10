'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  applyCouponRequest,
  CartData,
  formatCurrency,
  removeCartItemRequest,
  removeCouponRequest,
  updateCartItemRequest
} from '@/lib/catalog';

interface CartPageClientProps {
  initialCart: CartData;
}

export function CartPageClient({ initialCart }: CartPageClientProps) {
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState(cart.coupon?.code ?? '');
  const [loadingItemId, setLoadingItemId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        {cart.items.length ? cart.items.map((item) => (
          <article key={item.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">{item.productName}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                <button type="button" className="font-semibold text-brand" onClick={() => mutateCart(() => removeCartItemRequest(item.id), 'Item removed.', item.id)} disabled={loadingItemId === item.id}>Remove</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
                <button type="button" className="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-ink" onClick={() => mutateCart(() => updateCartItemRequest(item.id, Math.max(1, item.quantity - 1)), 'Cart updated.', item.id)} disabled={loadingItemId === item.id || item.quantity <= 1}>-</button>
                <span className="min-w-8 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                <button type="button" className="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-ink" onClick={() => mutateCart(() => updateCartItemRequest(item.id, item.quantity + 1), 'Cart updated.', item.id)} disabled={loadingItemId === item.id}>+</button>
              </div>
              <p className="text-lg font-extrabold text-ink">{formatCurrency(item.unitPrice * item.quantity)}</p>
            </div>
          </article>
        )) : (
          <article className="card p-8 text-center">
            <h2 className="text-2xl font-bold text-ink">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted">Add a few bottles from the catalog to continue to checkout.</p>
            <Link href="/shop" className="btn-primary mt-5">Browse catalog</Link>
          </article>
        )}
      </section>

      <aside className="card h-fit p-6">
        <h2 className="text-xl font-bold text-ink">Cart summary</h2>
        <form className="mt-5 flex gap-2" onSubmit={handleCouponSubmit}>
          <input className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Enter coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
          <button className="btn-secondary px-4 py-3 text-sm" disabled={loadingItemId === 'global'}>Apply</button>
        </form>
        {cart.coupon ? <button type="button" className="mt-3 text-sm font-semibold text-brand" onClick={() => mutateCart(() => removeCouponRequest(), 'Coupon removed.')}>Remove coupon</button> : null}
        {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
          Coupon code: <span className="font-semibold text-ink">{cart.coupon?.code ?? 'No coupon'}</span>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between"><span>Items total</span><span>{formatCurrency(cart.summary.subtotal)}</span></div>
          <div className="flex items-center justify-between"><span>Discount</span><span className="text-brand">-{formatCurrency(cart.summary.discount)}</span></div>
          <div className="flex items-center justify-between"><span>Taxes</span><span>{formatCurrency(cart.summary.tax)}</span></div>
          <div className="flex items-center justify-between"><span>Delivery</span><span>{formatCurrency(cart.summary.delivery)}</span></div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-ink"><span>Total</span><span>{formatCurrency(cart.summary.payable)}</span></div>
        </div>
        <Link href="/checkout" className="btn-primary mt-6 block w-full text-center">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
