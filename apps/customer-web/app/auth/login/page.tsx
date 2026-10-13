'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { loginRequest, persistSession, sendOtpRequest } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('demo@indusreserve.in');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await sendOtpRequest({ identifier, purpose: 'login' });
      setPreviewCode(response.previewCode ?? '');
      setMessage(response.previewCode ? 'OTP generated. Use the code shown below.' : 'OTP sent successfully to your mobile.');
      setMode('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const session = await loginRequest(mode === 'password' ? { identifier, password } : { identifier, otp });
      persistSession(session);
      setMessage('Logged in successfully. Redirecting to home...');
      window.setTimeout(() => router.push('/'), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[70vh] items-center justify-center py-10 sm:py-16">
      <div className="card w-full max-w-xl p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Login</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">Sign in with mobile, email or OTP</h1>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={`chip ${mode === 'password' ? 'bg-brand text-white border-brand' : ''}`} onClick={() => setMode('password')}>Password</button>
          <button type="button" className={`chip ${mode === 'otp' ? 'bg-brand text-white border-brand' : ''}`} onClick={() => setMode('otp')}>OTP</button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Mobile number or email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          {mode === 'password' ? (
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          ) : (
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter 6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value)} />
          )}

          {previewCode ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">OTP preview fallback: <strong>{previewCode}</strong></div> : null}
          {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {mode === 'otp' ? <button type="button" className="btn-secondary flex-1" onClick={handleSendOtp} disabled={loading}>Resend OTP</button> : <button type="button" className="btn-secondary flex-1" onClick={handleSendOtp} disabled={loading}>Send OTP</button>}
            <button className="btn-primary flex-1" disabled={loading}>{loading ? 'Please wait...' : 'Continue'}</button>
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Link href="/auth/forgot-password" className="font-semibold text-brand">Forgot password?</Link>
          <Link href="/auth/signup" className="font-semibold text-brand">Create account</Link>
        </div>
      </div>
    </main>
  );
}
