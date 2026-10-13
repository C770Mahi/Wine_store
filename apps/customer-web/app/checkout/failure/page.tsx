'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckoutFailureContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Your payment was not completed. No order was created.';

  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Checkout</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Payment failed</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted">The payment was not verified successfully, so Near Kart did not create the order.</p>
      </div>

      <article className="card mx-auto max-w-3xl p-6 sm:p-8">
        <div className="rounded-3xl bg-rose-50 px-5 py-4 text-sm text-rose-700">{message}</div>
        <div className="mt-6 grid gap-4 rounded-3xl bg-slate-50 p-5 text-sm text-muted sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">What happened</p>
            <p className="mt-2">Payment was cancelled, declined, or failed verification.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Order status</p>
            <p className="mt-2">No order was created because backend verification is mandatory.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/checkout" className="btn-primary w-full justify-center sm:w-auto">Try payment again</Link>
          <Link href="/cart" className="btn-secondary w-full justify-center sm:w-auto">Return to cart</Link>
          <Link href="/shop" className="btn-secondary w-full justify-center sm:w-auto">Continue shopping</Link>
        </div>
      </article>
    </main>
  );
}

function CheckoutFailureFallback() {
  return (
    <main className="page-shell pb-16 pt-8">
      <div className="card mx-auto max-w-3xl p-8 text-center text-sm text-muted">Loading payment status...</div>
    </main>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={<CheckoutFailureFallback />}>
      <CheckoutFailureContent />
    </Suspense>
  );
}
