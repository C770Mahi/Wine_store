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
      setMessage(response.previewCode ? 'Account created. Use the OTP shown below to continue.' : 'Account created. Verify the OTP sent to your mobile.');
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
      setMessage('OTP verified. Your account is ready. You can sign in now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[70vh] items-center justify-center py-8 sm:py-16">
      <div className="card w-full max-w-2xl p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Create account</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">Sign up with mobile OTP</h1>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSignup}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-base" placeholder="Full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-base" placeholder="Mobile number" value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-base" placeholder="Email address" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-base" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <button className="btn-primary min-h-[44px] sm:col-span-2" disabled={loading}>{loading ? 'Please wait...' : 'Create account & send OTP'}</button>
        </form>

        {phase !== 'signup' ? (
          <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-ink">Verify your mobile OTP</h2>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base" placeholder="Enter 6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value)} />
            {previewCode ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">OTP preview fallback: <strong>{previewCode}</strong></div> : null}
            <button type="button" className="btn-primary min-h-[44px] w-full" onClick={handleVerifyOtp} disabled={loading || phase === 'done'}>{phase === 'done' ? 'Verified' : 'Verify OTP'}</button>
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
