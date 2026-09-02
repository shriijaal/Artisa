import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import Header from '../components/Header';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [status, setStatus] = useState('verifying'); // verifying | success | failed | canceled
  const [errorMessage, setErrorMessage] = useState('');

  const pidx = searchParams.get('pidx');
  const paymentId = searchParams.get('payment_id');
  const orderId = searchParams.get('order_id');
  const khaltiStatus = searchParams.get('status');

  useEffect(() => {
    // If Khalti redirected with a failure/cancel status, skip the verify call
    if (khaltiStatus && khaltiStatus !== 'Completed') {
      if (khaltiStatus === 'User canceled') {
        setStatus('canceled');
        addToast('Payment was canceled.', 'info');
      } else {
        setStatus('failed');
        setErrorMessage(`Payment ${khaltiStatus.toLowerCase()}.`);
        addToast(`Payment ${khaltiStatus.toLowerCase()}.`, 'error');
      }
      return;
    }

    if (!pidx || !paymentId) {
      setStatus('failed');
      setErrorMessage('Invalid payment callback — missing required parameters.');
      return;
    }

    if (!UUID_RE.test(paymentId)) {
      setStatus('failed');
      setErrorMessage('Invalid payment ID format.');
      return;
    }

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/payments/khalti/verify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pidx, payment_id: paymentId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        addToast('Payment confirmed! Your order is now active.', 'success');
      } else {
        setStatus('failed');
        setErrorMessage(data.error || data.details?.detail || 'Payment verification failed.');
        addToast(data.error || 'Payment verification failed.', 'error');
      }
    } catch (err) {
      console.error('Payment verify error:', err);
      setStatus('failed');
      setErrorMessage('Network error — could not reach the server.');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <Header />
        <LoadingSpinner label="Verifying your payment with Khalti..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="max-w-lg mx-auto px-6 py-20 text-center page-enter">
        {status === 'success' ? (
          <>
            <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-stone-900 mb-3">
              Payment Successful!
            </h1>
            <p className="text-stone-500 mb-8">
              Thank you for your purchase. Your order is now confirmed and being processed.
              {orderId && ' Any digital artworks in your order are now available to download.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/orders/history"
                className="rounded-lg bg-[#000] px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition"
              >
                View Order History
              </Link>
              <Link
                to="/"
                className="rounded-lg border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        ) : status === 'canceled' ? (
          <>
            <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-stone-900 mb-3">
              Payment Canceled
            </h1>
            <p className="text-stone-500 mb-8">
              You canceled the payment. Your order has been placed but remains unpaid. You can try paying again from your order history.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {orderId && (
                <Link
                  to="/orders/history"
                  className="rounded-lg bg-[#000] px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition"
                >
                  View My Orders
                </Link>
              )}
              <Link
                to="/marketplace"
                className="rounded-lg border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
              >
                Return to Marketplace
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-stone-900 mb-3">
              Payment Failed
            </h1>
            <p className="text-stone-500 mb-8">
              {errorMessage || 'We could not verify your payment. Your order has been placed but remains unpaid. Please try again or contact support.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/orders/history"
                className="rounded-lg bg-[#000] px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition"
              >
                View My Orders
              </Link>
              <Link
                to="/marketplace"
                className="rounded-lg border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
              >
                Return to Marketplace
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PaymentVerify;
