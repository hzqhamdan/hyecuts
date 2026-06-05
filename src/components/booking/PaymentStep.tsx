import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth } from '../../context/AuthContext';
import { ALL_SERVICES } from '../../data/hyecuts';

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

export function PaymentStep({ onPaymentSuccess }: { onPaymentSuccess: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedService, clientSecret, setClientSecret } = useBookingStore();
  const [isFetching, setIsFetching] = useState(false);

  const service = ALL_SERVICES.find(s => s.name === selectedService);
  // Example: require 50% deposit
  const numericPrice = service ? parseFloat(service.price) : 0;
  const depositAmount = (numericPrice * 0.5).toFixed(2);

  useEffect(() => {
    if (!clientSecret && !isFetching) {
      setIsFetching(true);
      api.post<{ clientSecret: string }>('/payments/create-intent', {
        body: {
          serviceId: service?.id || 1,
          userId: user?.id || 'guest',
        }
      })
      .then(data => {
        setClientSecret(data.clientSecret);
      })
      .catch(err => {
        console.error('Failed to create payment intent', err);
      })
      .finally(() => {
        setIsFetching(false);
      });
    }
  }, [clientSecret, isFetching, service, user, setClientSecret]);

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
          <span className="font-bold text-black dark:text-white mt-2 inline-block">Deposit: RM {depositAmount}</span>
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
