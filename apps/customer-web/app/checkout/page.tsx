import { formatCurrency, getAddresses, getCart } from '@/lib/catalog';

export default async function CheckoutPage() {
  const [addresses, cart] = await Promise.all([getAddresses(), getCart()]);

  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Checkout</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Address, slot, payment and age confirmation</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <article className="card p-6">
            <h2 className="text-xl font-bold text-ink">1. Select address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <div key={address.id} className="rounded-3xl border border-slate-200 p-4">
                  <p className="font-bold text-ink">{address.label}</p>
                  <p className="mt-2 text-sm text-muted">{address.addressLine1}, {address.city} - {address.pincode}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card p-6">
            <h2 className="text-xl font-bold text-ink">2. Delivery slot</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {['10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '18:00 - 19:00'].map((slot) => (
                <span key={slot} className="chip">{slot}</span>
              ))}
            </div>
          </article>

          <article className="card p-6">
            <h2 className="text-xl font-bold text-ink">3. Payment & verification</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {['UPI', 'Cards', 'Net Banking', 'Wallets', 'Razorpay', 'Stripe', 'COD (if allowed)'].map((option) => (
                <label key={option} className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-ink">
                  <input type="radio" name="payment" className="mr-2" />
                  {option}
                </label>
              ))}
            </div>
            <label className="mt-5 flex items-start gap-3 text-sm text-muted">
              <input type="checkbox" className="mt-1" />
              I confirm I meet the legal drinking age requirements for my region.
            </label>
          </article>
        </section>

        <aside className="card h-fit p-6">
          <h2 className="text-xl font-bold text-ink">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(cart.summary.subtotal)}</span></div>
            <div className="flex items-center justify-between"><span>Discount</span><span>-{formatCurrency(cart.summary.discount)}</span></div>
            <div className="flex items-center justify-between"><span>Delivery fee</span><span>{formatCurrency(cart.summary.delivery)}</span></div>
            <div className="flex items-center justify-between"><span>Taxes</span><span>{formatCurrency(cart.summary.tax)}</span></div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-ink"><span>Payable</span><span>{formatCurrency(cart.summary.payable)}</span></div>
          </div>
          <button className="btn-primary mt-6 w-full">Place order</button>
        </aside>
      </div>
    </main>
  );
}
