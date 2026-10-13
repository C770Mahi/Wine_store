'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProfileRequest, getStoredUser, hasStoredSession, SessionUser, updateStoredUser } from '@/lib/auth';
import { Address, CustomerOrder, formatCurrency, getAddresses, getOrders } from '@/lib/catalog';

function formatStatusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (['delivered', 'confirmed', 'packed', 'picked_up'].includes(normalized)) {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (['cancelled', 'failed', 'rejected'].includes(normalized)) {
    return 'bg-rose-50 text-rose-700';
  }
  return 'bg-amber-50 text-amber-700';
}

export default function AccountPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const hydrateAccount = async () => {
      const sessionExists = hasStoredSession();
      const storedUser = getStoredUser();
      setHasSession(sessionExists);
      setProfile(storedUser);

      if (!sessionExists) {
        setIsLoading(false);
        return;
      }

      try {
        const [{ user }, nextAddresses, nextOrders] = await Promise.all([
          getProfileRequest(),
          getAddresses(),
          getOrders()
        ]);
        setProfile(user);
        updateStoredUser(user);
        setAddresses(nextAddresses);
        setOrders(nextOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load your account right now.');
      } finally {
        setIsLoading(false);
      }
    };

    void hydrateAccount();
  }, []);

  if (isLoading) {
    return (
      <main className="page-shell pb-16 pt-8">
        <div className="card p-8 text-center text-sm text-muted">Loading your profile...</div>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="page-shell pb-16 pt-8">
        <article className="card mx-auto max-w-2xl p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Customer profile</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">Sign in to open your account</h1>
          <p className="mt-3 text-sm text-muted">Your name, mobile number, saved addresses, and order history are available after login.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/login" className="btn-primary w-full sm:w-auto">Login</Link>
            <Link href="/auth/signup" className="btn-secondary w-full sm:w-auto">Create account</Link>
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="page-shell pb-16 pt-8">
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Customer profile</p>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Manage your Near Kart account</h1>
        <p className="max-w-3xl text-sm text-muted">Review your saved details, delivery contact information, and recent order history from one place.</p>
      </div>

      {error ? <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <article className="card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-black text-white">
                  {(profile?.name?.trim().charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-ink">{profile?.name ?? 'Customer'}</p>
                  <p className="mt-1 text-sm text-muted">Near Kart customer account</p>
                </div>
              </div>
              <Link href="/shop" className="btn-secondary w-full justify-center sm:w-auto">Continue shopping</Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Mobile number</p>
                <p className="mt-2 font-semibold text-ink">{profile?.mobile ?? 'Not available'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Email</p>
                <p className="mt-2 break-all font-semibold text-ink">{profile?.email ?? 'Not available'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Verification</p>
                <p className="mt-2 font-semibold text-ink">{profile?.isMobileVerified ? 'Mobile verified' : 'Verification pending'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Order history</p>
                <p className="mt-2 font-semibold text-ink">{orders.length} orders</p>
              </div>
            </div>
          </article>

          <article className="card p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-ink">Order history</h2>
                <p className="mt-1 text-sm text-muted">See your recent Near Kart orders and current statuses.</p>
              </div>
              <Link href="/checkout" className="text-sm font-semibold text-brand">Place another order</Link>
            </div>

            {orders.length ? (
              <div className="mt-6 space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Order number</p>
                        <p className="mt-2 text-lg font-bold text-ink">{order.orderNumber}</p>
                        <p className="mt-1 text-sm text-muted">Expected delivery: {order.deliveryEta}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>{formatStatusLabel(order.status)}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.paymentStatus)}`}>{formatStatusLabel(order.paymentStatus)}</span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Total</p>
                        <p className="mt-2 font-semibold text-ink">{formatCurrency(order.grandTotal)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Order status</p>
                        <p className="mt-2 font-semibold text-ink">{formatStatusLabel(order.status)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Payment</p>
                        <p className="mt-2 font-semibold text-ink">{formatStatusLabel(order.paymentStatus)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-muted">No orders found yet. Place your first order to start your order history.</div>
            )}
          </article>
        </div>

        <div className="space-y-6">
          <article className="card p-6 sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-ink">Profile details</h2>
            <div className="mt-6 space-y-4 text-sm text-muted">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Full name</p>
                <p className="mt-2 text-base font-semibold text-ink">{profile?.name ?? 'Not available'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Mobile</p>
                <p className="mt-2 text-base font-semibold text-ink">{profile?.mobile ?? 'Not available'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Email address</p>
                <p className="mt-2 break-all text-base font-semibold text-ink">{profile?.email ?? 'Not available'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">KYC status</p>
                <p className="mt-2 text-base font-semibold text-ink">{profile ? formatStatusLabel(profile.kycStatus) : 'Not available'}</p>
                {profile?.kycRejectedReason ? <p className="mt-2 text-sm text-rose-700">{profile.kycRejectedReason}</p> : null}
              </div>
            </div>
          </article>

          <article className="card p-6 sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-ink">Saved addresses</h2>
            {addresses.length ? (
              <div className="mt-6 space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="rounded-3xl border border-slate-200 p-4">
                    <p className="font-bold text-ink">{address.label}</p>
                    {address.recipientName ? <p className="mt-2 text-sm text-muted">{address.recipientName}</p> : null}
                    <p className="mt-1 text-sm text-muted">{address.addressLine1}</p>
                    <p className="mt-1 text-sm text-muted">{address.city}, {address.state} - {address.pincode}</p>
                    {address.mobile ? <p className="mt-1 text-sm text-muted">{address.mobile}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-muted">No saved addresses found for this account yet.</div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
