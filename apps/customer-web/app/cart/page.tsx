import { CartPageClient } from '@/components/cart-page-client';

export default function CartPage() {
  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Shopping cart</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Review cart, coupons and delivery charges</h1>
      </div>
      <CartPageClient />
    </main>
  );
}
