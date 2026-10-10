'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { signupRequest, verifyOtpRequest } from '@/lib/auth';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [phase, setPhase] = useState<'signup' | 'verify' | 'done'>('signup');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await signupRequest(form);
      setPreviewCode(response.previewCode ?? '');
      setPhase('verify');
      setMessage('Account created. Verify the OTP sent to your mobile.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await verifyOtpRequest({ identifier: form.mobile, purpose: 'signup', code: otp });
      setPhase('done');
      setMessage('OTP verified. Your account is ready.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-2xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Create account</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Sign up with age verification and OTP</h1>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSignup}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Mobile number" value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email address" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <div className="sm:col-span-2 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-muted">
            <input type="checkbox" className="mt-1" defaultChecked />
            <span>I confirm I meet the legal drinking age requirements for my region and agree to OTP verification for account access.</span>
          </div>
          <button className="btn-primary sm:col-span-2" disabled={loading}>{loading ? 'Please wait...' : 'Create account & send OTP'}</button>
        </form>

        {phase !== 'signup' ? (
          <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-ink">Verify your mobile OTP</h2>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter 6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value)} />
            {previewCode ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Dev OTP preview: <strong>{previewCode}</strong></div> : null}
            <button type="button" className="btn-primary w-full" onClick={handleVerifyOtp} disabled={loading || phase === 'done'}>{phase === 'done' ? 'Verified' : 'Verify OTP'}</button>
          </div>
        ) : null}

        {message ? <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-6 text-sm text-muted">
          Already have an account? <Link href="/auth/login" className="font-semibold text-brand">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
