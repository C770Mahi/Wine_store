'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getStoredUser, hasStoredSession, SessionUser } from '@/lib/auth';
import {
  Address,
  CartData,
  createCheckoutSessionRequest,
  formatCurrency,
  getAddresses,
  getCart,
  recordRazorpayFailureRequest,
  verifyRazorpayPaymentRequest
} from '@/lib/catalog';
import { AddressBookManager } from '@/components/address-book-manager';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: string, callback: (response: RazorpayPaymentFailureResponse) => void) => void;
    };
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayPaymentSuccessResponse) => void | Promise<void>;
};

type RazorpayPaymentSuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayPaymentFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

const emptyCart: CartData = {
  id: 'cart-empty',
  userId: 'guest',
  items: [],
  summary: {
    subtotal: 0,
    discount: 0,
    tax: 0,
    delivery: 0,
    payable: 0
  }
};

const slots = ['10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '18:00 - 19:00'];
const supportedPaymentMethods = ['UPI', 'Google Pay (GPay)', 'PhonePe', 'Paytm', 'Credit Cards', 'Debit Cards', 'Net Banking', 'Wallets'];

export function CheckoutPageClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartData>(emptyCart);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(slots[0]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  useEffect(() => {
    const hydrateCheckout = async () => {
      const sessionExists = hasStoredSession();
      setHasSession(sessionExists);
      setSessionUser(getStoredUser());

      if (!sessionExists) {
        setIsLoading(false);
        return;
      }

      try {
        const [nextAddresses, nextCart] = await Promise.all([getAddresses(), getCart()]);
        setAddresses(nextAddresses);
        setCart(nextCart);
        setSelectedAddressId(nextAddresses[0]?.id ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load checkout data.');
      } finally {
        setIsLoading(false);
      }
    };

    void hydrateCheckout();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select an address.');
      return;
    }

    if (!cart.items.length) {
      setError('Your cart is empty. Add items before paying.');
      return;
    }

    if (!isRazorpayReady || !window.Razorpay) {
      setError('Razorpay checkout is still loading. Please wait a moment and try again.');
      return;
    }

    setPlacingOrder(true);
    setError('');
    setMessage('Creating a secure Razorpay order...');

    try {
      const checkout = await createCheckoutSessionRequest({
        addressId: selectedAddressId,
        slot: selectedSlot,
        ageConfirmed: true
      });

      let handled = false;

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'Near Kart',
        description: checkout.description,
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: checkout.customer.name,
          email: checkout.customer.email,
          contact: checkout.customer.contact
        },
        notes: {
          checkoutSessionId: checkout.checkoutSessionId,
          selectedSlot
        },
        theme: {
          color: '#16a34a'
        },
        modal: {
          ondismiss: () => {
            if (handled) {
              return;
            }

            setPlacingOrder(false);
            setMessage('Payment window closed. You can retry checkout anytime.');
          }
        },
        handler: async (paymentResponse) => {
          handled = true;
          setMessage('Payment received. Verifying securely on the backend and creating your order...');

          try {
            const verified = await verifyRazorpayPaymentRequest({
              checkoutSessionId: checkout.checkoutSessionId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature
            });
            setCart(emptyCart);
            router.push(`/checkout/success?orderId=${encodeURIComponent(verified.orderId)}`);
          } catch (verificationError) {
            setPlacingOrder(false);
            const failureMessage = verificationError instanceof Error ? verificationError.message : 'Payment verification failed.';
            setError(failureMessage);
            await recordRazorpayFailureRequest({
              checkoutSessionId: checkout.checkoutSessionId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              description: failureMessage,
              reason: 'verification_failed',
              metadata: {
                razorpayPaymentId: paymentResponse.razorpay_payment_id
              }
            }).catch(() => undefined);
            router.push(`/checkout/failure?message=${encodeURIComponent(failureMessage)}`);
          }
        }
      });

      razorpay.on('payment.failed', (failureResponse) => {
        handled = true;
        setPlacingOrder(false);
        const failure = failureResponse.error;
        const failureMessage = failure?.description ?? failure?.reason ?? 'Payment failed. Please try again.';
        setError(failureMessage);
        void recordRazorpayFailureRequest({
          checkoutSessionId: checkout.checkoutSessionId,
          razorpayOrderId: failure?.metadata?.order_id ?? checkout.razorpayOrderId,
          code: failure?.code,
          description: failure?.description,
          source: failure?.source,
          step: failure?.step,
          reason: failure?.reason,
          metadata: {
            razorpayPaymentId: failure?.metadata?.payment_id
          }
        }).catch(() => undefined);
        router.push(`/checkout/failure?message=${encodeURIComponent(failureMessage)}`);
      });

      razorpay.open();
      setMessage('Choose any supported method in Razorpay and complete the payment securely.');
    } catch (err) {
      setPlacingOrder(false);
      setMessage('');
      setError(err instanceof Error ? err.message : 'Unable to launch Razorpay checkout.');
    }
  };

  if (isLoading) {
    return <div className="card p-8 text-center text-sm text-muted">Loading checkout details...</div>;
  }

  if (!hasSession) {
    return (
      <article className="card p-8 text-center">
        <h2 className="text-2xl font-bold text-ink">Please sign in to continue checkout</h2>
        <p className="mt-2 text-sm text-muted">Your address book and orders are tied to your account session.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/auth/login" className="btn-primary w-full sm:w-auto">Login</Link>
          <Link href="/auth/signup" className="btn-secondary w-full sm:w-auto">Create account</Link>
        </div>
      </article>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setIsRazorpayReady(true)} onError={() => setError('Unable to load Razorpay checkout right now.')} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <AddressBookManager
            title="1. Delivery addresses"
            subtitle="Save multiple delivery locations, set a default address, or add a new address during checkout."
            addresses={addresses}
            onAddressesChange={setAddresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            profileName={sessionUser?.name}
            profileMobile={sessionUser?.mobile}
            emptyMessage={`No saved addresses found for ${sessionUser?.name ?? 'this account'} yet. Add one to continue checkout.`}
          />

          <article className="card p-6">
            <h2 className="text-xl font-bold text-ink">2. Delivery slot</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {slots.map((slot) => (
                <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`chip ${selectedSlot === slot ? 'bg-brand text-white border-brand' : ''}`}>{slot}</button>
              ))}
            </div>
          </article>

          <article className="card p-6">
            <h2 className="text-xl font-bold text-ink">3. Pay online with Razorpay</h2>
            <p className="mt-2 text-sm text-muted">Payments are collected directly into your Razorpay merchant account and are verified securely on the backend before the order is created.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {supportedPaymentMethods.map((option) => (
                <span key={option} className="chip border-brand/30 bg-brand-soft text-ink">{option}</span>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-muted">
              Razorpay will automatically show the eligible payment methods for the customer device and bank account.
            </div>
          </article>
        </section>

        <aside className="card h-fit p-6">
          <h2 className="text-xl font-bold text-ink">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm text-muted">
            {selectedAddress ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Deliver to</p>
                <p className="mt-2 font-semibold text-ink">{selectedAddress.fullName || selectedAddress.recipientName}</p>
                <p className="mt-1">{selectedAddress.formattedAddress}</p>
              </div>
            ) : null}
            <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(cart.summary.subtotal)}</span></div>
            <div className="flex items-center justify-between"><span>Discount</span><span>-{formatCurrency(cart.summary.discount)}</span></div>
            <div className="flex items-center justify-between"><span>Delivery fee</span><span>{formatCurrency(cart.summary.delivery)}</span></div>
            <div className="flex items-center justify-between"><span>Taxes</span><span>{formatCurrency(cart.summary.tax)}</span></div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-ink"><span>Payable</span><span>{formatCurrency(cart.summary.payable)}</span></div>
          </div>
          {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          <button className="btn-primary mt-6 w-full" onClick={handlePlaceOrder} disabled={placingOrder || !cart.items.length || !selectedAddressId}>{placingOrder ? 'Opening Razorpay...' : 'Pay securely with Razorpay'}</button>
          {!isRazorpayReady ? <p className="mt-3 text-xs text-muted">Preparing secure payment options...</p> : null}
        </aside>
      </div>
    </>
  );
}
