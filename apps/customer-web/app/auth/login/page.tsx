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
    <main className="page-shell flex min-h-[64vh] items-center justify-center py-6 sm:py-10">
      <div className="card w-full max-w-lg p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand sm:text-sm">Account</p>
        <h1 className="mt-2 text-xl font-black tracking-tight text-ink sm:text-2xl">Access your account with mobile, email or OTP</h1>

        <div className="mt-4 flex flex-col gap-2 min-[390px]:flex-row min-[390px]:flex-wrap">
          <button type="button" className={`chip min-h-[40px] w-full justify-center min-[390px]:w-auto ${mode === 'password' ? 'border-brand bg-brand text-white' : ''}`} onClick={() => setMode('password')}>Password</button>
          <button type="button" className={`chip min-h-[40px] w-full justify-center min-[390px]:w-auto ${mode === 'otp' ? 'border-brand bg-brand text-white' : ''}`} onClick={() => setMode('otp')}>OTP</button>
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base" placeholder="Mobile number or email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          {mode === 'password' ? (
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          ) : (
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base" placeholder="Enter 6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value)} />
          )}

          {previewCode ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">OTP preview fallback: <strong>{previewCode}</strong></div> : null}
          {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            {mode === 'otp' ? <button type="button" className="btn-secondary min-h-[42px] flex-1" onClick={handleSendOtp} disabled={loading}>Resend OTP</button> : <button type="button" className="btn-secondary min-h-[42px] flex-1" onClick={handleSendOtp} disabled={loading}>Send OTP</button>}
            <button className="btn-primary min-h-[42px] flex-1" disabled={loading}>{loading ? 'Please wait...' : 'Continue'}</button>
          </div>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Link href="/auth/forgot-password" className="font-semibold text-brand">Forgot password?</Link>
          <Link href="/auth/signup" className="font-semibold text-brand">Create account</Link>
        </div>
      </div>
    </main>
  );
}
