import { CartPageClient } from '@/components/cart-page-client';

export default function CartPage() {
  return (
    <main className="page-shell pb-16 pt-6">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Shopping cart</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">Review cart, coupons and delivery charges</h1>
      </div>
      <CartPageClient />
    </main>
  );
}
