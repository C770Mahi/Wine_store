import Link from 'next/link';

export default function VerificationPage() {
  return (
    <main className="page-shell py-12">
      <article className="card mx-auto max-w-2xl p-5 text-center sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Temporarily disabled</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">Age verification is paused for now</h1>
        <p className="mt-3 text-sm text-muted">This verification flow has been temporarily disabled. You can continue using signup, login, cart, and checkout without submitting age-proof details.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn-primary w-full sm:w-auto">Continue shopping</Link>
          <Link href="/auth/signup" className="btn-secondary w-full sm:w-auto">Back to signup</Link>
        </div>
      </article>
    </main>
  );
}
