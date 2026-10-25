import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth } from '../../context/AuthContext';

// Initialize Stripe outside of component to avoid recreating the object
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We will rely on a redirect or handle it on the same page depending on setup.
        // If we want to stay on the same page and handle state:
        // return_url is required by default for some payment methods, but we can bypass redirect if possible
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message || t('booking.payment.error_generic', { defaultValue: 'An unexpected error occurred.' }));
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-50 dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-black dark:bg-white text-white dark:text-black py-5 font-bold uppercase tracking-widest text-xs hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <>
            <ShieldCheck size={16} />
            {t('booking.payment.pay_deposit', { defaultValue: 'Pay Deposit & Confirm' })}
          </>
        )}
      </button>
    </form>
  );
}

export function PaymentStep({ serviceId, onPaymentSuccess }: { serviceId: number | undefined; onPaymentSuccess: () => void }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { clientSecret, setClientSecret, depositAmount, setDepositAmount } = useBookingStore();
  const [loadFailed, setLoadFailed] = useState(false);
  // The service an intent was already requested for, so a re-render (or React's
  // double-invoked effects in dev) can't create a second PaymentIntent.
  const requestedFor = useRef<number | null>(null);

  // PAY-004: the deposit used to be computed here from the static price list
  // ("RM 25", so parseFloat gave NaN) and the intent requested for
  // `service?.id || 1`, a different service whenever the name didn't match.
  // The service id now comes from the booking flow's database lookup, and the
  // amount shown is the one the server actually charged.
  useEffect(() => {
    if (clientSecret || !token || serviceId === undefined || requestedFor.current === serviceId) return;
    requestedFor.current = serviceId;
    api.post<{ clientSecret: string; depositAmount: string }>('/payments/create-intent', {
      body: { serviceId },
      token
    })
      .then(data => {
        setClientSecret(data.clientSecret);
        setDepositAmount(data.depositAmount);
      })
      .catch((err: unknown) => {
        console.error('Failed to create payment intent', err);
        setLoadFailed(true);
      });
  }, [clientSecret, serviceId, token, setClientSecret, setDepositAmount]);

  if (serviceId === undefined || loadFailed) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <p className="text-zinc-500 font-sans text-sm">
          {t('booking.payment.unavailable', { defaultValue: 'We could not set up the deposit for this service. Please go back and try again.' })}
        </p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
        <p className="text-zinc-500 font-sans text-sm uppercase tracking-widest">
          {t('booking.payment.initializing', { defaultValue: 'Securely initializing payment...' })}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-xl mx-auto w-full"
    >
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl font-light text-black dark:text-white mb-2">
          {t('booking.payment.title', { defaultValue: 'Secure Deposit' })}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 font-sans text-sm max-w-md mx-auto">
          {t('booking.payment.description', { defaultValue: 'A 50% deposit is required to secure your appointment. This will be deducted from your final bill.' })}
          <br/>
          {depositAmount && (
            <span className="font-bold text-black dark:text-white mt-2 inline-block">Deposit: RM {depositAmount}</span>
          )}
        </p>
      </div>

      <Elements 
        stripe={stripePromise} 
        options={{ 
          clientSecret,
          appearance: {
            theme: 'night', // Or dynamic based on dark mode, but 'night' fits the luxury aesthetic well, or we can use variables
            variables: {
              colorPrimary: '#FAFAFA',
              colorBackground: '#1A1A1A',
              colorText: '#FAFAFA',
              colorDanger: '#ef4444',
              fontFamily: 'Inter, sans-serif',
              spacingUnit: '4px',
              borderRadius: '0px',
            }
          } 
        }}
      >
        <CheckoutForm onSuccess={onPaymentSuccess} />
      </Elements>
      
      <div className="mt-8 flex justify-center items-center gap-2 text-zinc-400 text-xs">
        <ShieldCheck size={14} />
        <span>{t('booking.payment.secure_ssl', { defaultValue: 'Payments are secure and encrypted via Stripe SSL.' })}</span>
      </div>
    </motion.div>
  );
}
