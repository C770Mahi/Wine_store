const stats = [
  { label: 'Orders today', value: '1,248' },
  { label: 'Revenue', value: '₹8.6L' },
  { label: 'Low stock SKUs', value: '42' },
  { label: 'Active partners', value: '186' }
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Admin dashboard</p>
          <h1 className="mt-2 text-4xl font-black">Operations control center</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">Starter admin surface for product management, inventory, orders, customers, coupons, delivery operations, and analytics.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-extrabold">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Modules</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {['Products', 'Inventory', 'Orders', 'Customers', 'Coupons', 'Revenue Reports', 'Analytics', 'Support'].map((module) => (
                <div key={module} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm font-semibold text-slate-200">
                  {module}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Order queue</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              {['Packed and waiting for rider assignment', 'Refund requested for failed payment order', 'Promo-driven spike in Koramangala', 'Brandy shelf running low in Whitefield store'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">{item}</div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
