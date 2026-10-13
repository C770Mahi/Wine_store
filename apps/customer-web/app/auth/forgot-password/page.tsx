'use client';

import { FormEvent, useState } from 'react';
import { forgotPasswordRequest, resetPasswordRequest } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [phase, setPhase] = useState<'request' | 'reset' | 'done'>('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPasswordRequest(identifier);
      setPreviewCode(response.previewCode ?? '');
      setPhase('reset');
      setMessage(response.previewCode ? 'Reset OTP generated. Use the code shown below.' : 'Reset OTP sent successfully to your mobile.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPasswordRequest({ identifier, code, password });
      setPhase('done');
      setMessage('Password reset complete. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Forgot password</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Reset using mobile OTP or email</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSend}>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter mobile or email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          <button className="btn-primary w-full" disabled={loading || phase !== 'request'}>{loading && phase === 'request' ? 'Please wait...' : 'Send reset OTP'}</button>
        </form>

        {phase !== 'request' ? (
          <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 p-5">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter OTP" value={code} onChange={(event) => setCode(event.target.value)} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {previewCode ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">OTP preview fallback: <strong>{previewCode}</strong></div> : null}
            <button type="button" className="btn-primary w-full" onClick={handleReset} disabled={loading || phase === 'done'}>{phase === 'done' ? 'Password updated' : 'Reset password'}</button>
          </div>
        ) : null}

        {message ? <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </div>
    </main>
  );
}
