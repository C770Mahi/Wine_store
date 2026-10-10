const tasks = [
  'Order #IR1042 · Pickup at Residency Road store',
  'Order #IR1045 · Deliver to HSR Layout in 22 mins',
  'Order #IR1051 · COD verification required',
  'Order #IR1058 · Customer requested call before arrival'
];

export default function PartnerDashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-100">Delivery partner panel</p>
          <h1 className="mt-2 text-4xl font-black">Assignment, tracking and earnings</h1>
          <p className="mt-3 max-w-3xl text-sm text-emerald-50/90">Starter partner interface for OTP login, live task queue, route guidance, status updates, and daily earnings.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['Assigned orders', '12'],
            ['Completed today', '8'],
            ['Estimated earnings', '₹1,740']
          ].map(([label, value]) => (
            <article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Current assignments</h2>
            <div className="mt-5 space-y-3">
              {tasks.map((task) => (
                <div key={task} className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
                  {task}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Actions</h2>
            <div className="mt-5 space-y-3">
              {['Accept assignment', 'Mark picked up', 'Update live location', 'Confirm delivered', 'View earnings statement'].map((action) => (
                <button key={action} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
