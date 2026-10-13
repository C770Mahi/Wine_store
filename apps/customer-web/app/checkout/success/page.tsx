import { Suspense } from 'react';
import { CheckoutSuccessClient } from './success-page-client';

function CheckoutSuccessFallback() {
  return (
    <main className="page-shell pb-16 pt-8">
      <div className="card p-8 text-center text-sm text-muted">Loading your order confirmation...</div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
