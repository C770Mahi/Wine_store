'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomerOrderDetail, formatCurrency, getOrderById } from '@/lib/catalog';

function formatStatusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (['delivered', 'confirmed', 'packed', 'picked_up', 'out_for_delivery', 'paid', 'captured', 'authorized'].includes(normalized)) {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (['cancelled', 'failed', 'rejected', 'refunded'].includes(normalized)) {
    return 'bg-rose-50 text-rose-700';
  }
  return 'bg-amber-50 text-amber-700';
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Order reference is missing.');
        setIsLoading(false);
        return;
      }

      try {
        const nextOrder = await getOrderById(orderId);
        if (!nextOrder) {
          setError('Order not found. Please check your account page.');
          return;
        }
        setOrder(nextOrder);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your order confirmation.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Checkout</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Payment successful</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted">Your Razorpay payment has been verified on the backend and your Near Kart order has been created successfully.</p>
      </div>

      {isLoading ? <div className="card p-8 text-center text-sm text-muted">Loading your order confirmation...</div> : null}
      {!isLoading && error ? <div className="card rounded-3xl bg-rose-50 p-6 text-sm text-rose-700">{error}</div> : null}

      {!isLoading && order ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <article className="card p-5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Order confirmed</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">{order.orderNumber}</h2>
                  <p className="mt-2 text-sm text-muted">Placed on {formatDate(order.createdAt)} · Expected delivery ETA: {order.deliveryEta}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>{formatStatusLabel(order.status)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.paymentStatus)}`}>{formatStatusLabel(order.paymentStatus)}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 min-[390px]:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Order total</p>
                  <p className="mt-2 font-semibold text-ink">{formatCurrency(order.grandTotal)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Payment method</p>
                  <p className="mt-2 font-semibold text-ink">{order.paymentMethod ?? 'Razorpay'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Razorpay order ID</p>
                  <p className="mt-2 break-all font-semibold text-ink">{order.razorpayOrderId ?? 'Pending'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Transaction ID</p>
                  <p className="mt-2 break-all font-semibold text-ink">{order.razorpayPaymentId ?? 'Pending'}</p>
                </div>
              </div>
            </article>

            <article className="card p-5 sm:p-8">
              <h2 className="text-2xl font-black tracking-tight text-ink">Delivery address</h2>
              <div className="mt-4 rounded-3xl bg-slate-50 p-5 text-sm text-muted">
                <p className="font-semibold text-ink">{order.deliveryAddress.recipientName}</p>
                <p className="mt-2">{order.deliveryAddress.mobile}</p>
                <p className="mt-2">{order.deliveryAddress.addressLine1}</p>
                {order.deliveryAddress.addressLine2 ? <p className="mt-1">{order.deliveryAddress.addressLine2}</p> : null}
                {order.deliveryAddress.landmark ? <p className="mt-1">{order.deliveryAddress.landmark}</p> : null}
                <p className="mt-1">{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                {order.googleMapsLink ? <a href={order.googleMapsLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-brand">Open pinned map location</a> : null}
              </div>
            </article>
          </section>

          <aside className="card h-fit p-6">
            <h2 className="text-xl font-bold text-ink">Next steps</h2>
            <div className="mt-5 space-y-4 text-sm text-muted">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">Backend verification passed and the order is now visible in your admin dashboard and customer account.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Track this order from your account page and follow delivery status updates there.
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/account" className="btn-primary w-full justify-center">Track order</Link>
              <Link href="/shop" className="btn-secondary w-full justify-center">Continue shopping</Link>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
