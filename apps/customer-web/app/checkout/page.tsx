import { CheckoutPageClient } from '@/components/checkout-page-client';

export default function CheckoutPage() {
  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Checkout</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Address, slot, payment and age confirmation</h1>
      </div>
      <CheckoutPageClient />
    </main>
  );
}
