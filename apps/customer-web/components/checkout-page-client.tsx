'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredUser, hasStoredSession, SessionUser } from '@/lib/auth';
import { Address, CartData, createOrderRequest, formatCurrency, getAddresses, getCart } from '@/lib/catalog';

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

const slots = ['10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '18:00 - 19:00'];
const paymentOptions = ['UPI', 'Cards', 'Net Banking', 'Wallets', 'Razorpay', 'Stripe'];

export function CheckoutPageClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartData>(emptyCart);
  const [placedSummary, setPlacedSummary] = useState<CartData['summary'] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(slots[0]);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const hasPlacedOrder = Boolean(orderNumber);
  const summary = placedSummary ?? cart.summary;

  useEffect(() => {
    const hydrateCheckout = async () => {
      const sessionExists = hasStoredSession();
      setHasSession(sessionExists);
      setSessionUser(getStoredUser());

      if (!sessionExists) {
        setIsLoading(false);
        return;
      }

      try {
        const [nextAddresses, nextCart] = await Promise.all([getAddresses(), getCart()]);
        setAddresses(nextAddresses);
        setCart(nextCart);
        setSelectedAddressId(nextAddresses[0]?.id ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load checkout data.');
      } finally {
        setIsLoading(false);
      }
    };

    void hydrateCheckout();
  }, []);

  const handlePlaceOrder = async () => {
    if (hasPlacedOrder) {
      return;
    }

    if (!selectedAddressId) {
      setError('Please select an address.');
      return;
    }

    setPlacingOrder(true);
    setError('');
    setMessage('');

    try {
      const response = await createOrderRequest({
        addressId: selectedAddressId,
        slot: selectedSlot,
        paymentMethod,
        ageConfirmed: true
      });
      setPlacedSummary(cart.summary);
      setOrderNumber(response.orderNumber);
      setMessage(`Order created successfully. Order number: ${response.orderNumber}`);
      setCart(emptyCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isLoading) {
    return <div className="card p-8 text-center text-sm text-muted">Loading checkout details...</div>;
  }

  if (!hasSession) {
    return (
      <article className="card p-8 text-center">
        <h2 className="text-2xl font-bold text-ink">Please sign in to continue checkout</h2>
        <p className="mt-2 text-sm text-muted">Your address book and orders are tied to your account session.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/auth/login" className="btn-primary">Login</Link>
          <Link href="/auth/signup" className="btn-secondary">Create account</Link>
        </div>
      </article>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        {hasPlacedOrder ? (
          <article className="card p-6">
            <h2 className="text-2xl font-bold text-ink">Order placed successfully</h2>
            <p className="mt-2 text-sm text-muted">Your order is confirmed and the checkout cart has been reset for the next purchase.</p>
            <div className="mt-5 grid gap-4 rounded-3xl bg-slate-50 p-5 text-sm text-muted sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Order number</p>
                <p className="mt-2 text-lg font-bold text-ink">{orderNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Payment method</p>
                <p className="mt-2 font-semibold text-ink">{paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Delivery slot</p>
                <p className="mt-2 font-semibold text-ink">{selectedSlot}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Next step</p>
                <p className="mt-2 font-semibold text-ink">Track it from the orders API until the account area is added.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Continue shopping</Link>
              <Link href="/cart" className="btn-secondary">Open cart</Link>
            </div>
          </article>
        ) : (
          <>
            <article className="card p-6">
              <h2 className="text-xl font-bold text-ink">1. Select address</h2>
              {addresses.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <button key={address.id} type="button" onClick={() => setSelectedAddressId(address.id)} className={`rounded-3xl border p-4 text-left ${selectedAddressId === address.id ? 'border-brand bg-brand-soft' : 'border-slate-200'}`}>
                      <p className="font-bold text-ink">{address.label}</p>
                      <p className="mt-2 text-sm text-muted">{address.addressLine1}, {address.city} - {address.pincode}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">No saved addresses found for {sessionUser?.name ?? 'this account'}.</p>
              )}
            </article>

            <article className="card p-6">
              <h2 className="text-xl font-bold text-ink">2. Delivery slot</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {slots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`chip ${selectedSlot === slot ? 'bg-brand text-white border-brand' : ''}`}>{slot}</button>
                ))}
              </div>
            </article>

            <article className="card p-6">
              <h2 className="text-xl font-bold text-ink">3. Payment</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {paymentOptions.map((option) => (
                  <label key={option} className={`rounded-2xl border p-4 text-sm font-semibold ${paymentMethod === option ? 'border-brand bg-brand-soft text-ink' : 'border-slate-200 text-ink'}`}>
                    <input type="radio" name="payment" className="mr-2" checked={paymentMethod === option} onChange={() => setPaymentMethod(option)} />
                    {option}
                  </label>
                ))}
              </div>
            </article>
          </>
        )}
      </section>

      <aside className="card h-fit p-6">
        <h2 className="text-xl font-bold text-ink">Order summary</h2>
        <div className="mt-5 space-y-3 text-sm text-muted">
          <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(summary.subtotal)}</span></div>
          <div className="flex items-center justify-between"><span>Discount</span><span>-{formatCurrency(summary.discount)}</span></div>
          <div className="flex items-center justify-between"><span>Delivery fee</span><span>{formatCurrency(summary.delivery)}</span></div>
          <div className="flex items-center justify-between"><span>Taxes</span><span>{formatCurrency(summary.tax)}</span></div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-ink"><span>Payable</span><span>{formatCurrency(summary.payable)}</span></div>
        </div>
        {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {orderNumber ? <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-ink">Track order <strong>{orderNumber}</strong> from the orders API once the account area is added.</div> : null}
        <button className="btn-primary mt-6 w-full" onClick={handlePlaceOrder} disabled={placingOrder || !cart.items.length || hasPlacedOrder}>{hasPlacedOrder ? 'Order placed' : placingOrder ? 'Placing order...' : 'Place order'}</button>
      </aside>
    </div>
  );
}
