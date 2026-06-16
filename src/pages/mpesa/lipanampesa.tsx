import { useState, useRef, useEffect, FormEvent } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Loader2, Smartphone, EuroIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const PayWithMpesa = () => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ phone?: string; amount?: string }>({});

  const API_URL = import.meta.env.VITE_API_URL;
  const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || '').toString();
  const socketRef = useRef<Socket | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const hardTimeoutRef = useRef<number | null>(null);
  const [showBubbles, setShowBubbles] = useState(false);
  const MySwal = withReactContent(Swal);

  const validateInputs = (): boolean => {
    const errors: { phone?: string; amount?: string } = {};

    if (!/^(01|07)\d{8}$/.test(phone)) {
      errors.phone = 'Enter valid 10-digit phone number (e.g. 0712345678)';
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = 'Enter a valid amount greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const connectSocket = () => {
    if (socketRef.current && socketRef.current.connected) return socketRef.current;
    // Derive socket URL: prefer VITE_SOCKET_URL, else strip trailing /api from API_URL
    const derivedUrl = SOCKET_URL || (API_URL ? API_URL.replace(/\/?api\/?$/, '') : '');
    socketRef.current = io(derivedUrl, { transports: ['websocket'] });
    return socketRef.current;
  };

  const clearTimers = () => {
    if (pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (hardTimeoutRef.current) {
      window.clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
      setShowBubbles(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors({});
    if (!validateInputs()) return;

    setShowBubbles(false);
    setLoading(true);

    try {
      const formattedPhone = '254' + phone.slice(-9);
      const numericAmount = Number(amount);

      MySwal.fire({
        title: 'Processing Payment...',
        text: 'Please wait while we initiate the STK push.',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
          // Add bouncing bubbles to the modal
          const modalContent = document.querySelector('.swal2-html-container');
          if (modalContent) {
            const bubblesContainer = document.createElement('div');
            bubblesContainer.className = 'flex items-center justify-center mt-4';
            bubblesContainer.innerHTML = `
              <div class="flex items-end space-x-3">
                <span class="w-5 h-5 rounded-full bg-green-500 animate-bounce" style="animation-delay: 0ms"></span>
                <span class="w-5 h-5 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 100ms"></span>
                <span class="w-5 h-5 rounded-full bg-yellow-500 animate-bounce" style="animation-delay: 200ms"></span>
                <span class="w-5 h-5 rounded-full bg-red-500 animate-bounce" style="animation-delay: 300ms"></span>
                <span class="w-5 h-5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 400ms"></span>
              </div>
            `;
            modalContent.appendChild(bubblesContainer);
          }
        }
      });

      const response = await axios.post(`${API_URL}/stkpush`, {
        phone: formattedPhone,
        amount: numericAmount
      });

      console.log('STK Push Response:', response.data);
      const { CheckoutRequestID } = response.data || {};

      // Join socket room by CheckoutRequestID to receive real-time updates
      if (CheckoutRequestID) {
        const socket = connectSocket();

        // Remove any prior listener to avoid duplicates
        socket.off('transaction_update');

        socket.emit('join_checkout', { checkoutRequestId: CheckoutRequestID });

        // Soft pending notice after 45s
        pendingTimerRef.current = window.setTimeout(() => {
          MySwal.fire({
            title: 'Still Pending…',
            text: 'If you have not received the prompt, ensure your SIM is active and try again.',
            icon: 'info',
            confirmButtonText: 'OK'
          });
        }, 45000);

        // Hard fallback after 3 minutes if no callback received
        hardTimeoutRef.current = window.setTimeout(() => {
          setShowBubbles(false);
          MySwal.fire({
            title: 'Payment Timeout',
            text: 'We did not receive a response in time. Please try again.',
            icon: 'warning',
            confirmButtonText: 'OK'
          });
        }, 180000);

        socket.on('transaction_update', (payload: any) => {
          clearTimers();
          setShowBubbles(false);
          const status: string = payload?.status || 'failure';
          const desc: string = payload?.resultDesc || 'Payment update received.';

          // Close loading if open
          Swal.close();

          if (status === 'success') {
            MySwal.fire({
              title: 'Payment Successful',
              text: `KES ${payload?.amount || numericAmount} received. Receipt: ${payload?.receipt || 'N/A'}`,
              icon: 'success',
              confirmButtonText: 'Great'
            });
          } else if (status === 'cancelled') {
            MySwal.fire({
              title: 'Payment Cancelled',
              text: 'You cancelled the payment prompt.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          } else if (status === 'wrong_pin') {
            MySwal.fire({
              title: 'Wrong PIN',
              text: 'The PIN entered was incorrect. Please try again.',
              icon: 'error',
              confirmButtonText: 'Retry'
            });
          } else if (status === 'insufficient_funds') {
            MySwal.fire({
              title: 'Insufficient Funds',
              text: 'Your M-Pesa balance is insufficient for this transaction.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          } else if (status === 'timeout') {
            MySwal.fire({
              title: 'Request Timed Out',
              text: 'The payment request timed out. Please try again.',
              icon: 'warning',
              confirmButtonText: 'OK'
            });
          } else {
            MySwal.fire({
              title: 'Payment Failed',
              text: desc,
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }

      setPhone('');
      setAmount('');
      setShowBubbles(true);

    } catch (err: any) {
      console.error('STK Push Error:', err);
      const backendError = err?.response?.data;
      const details = typeof backendError?.details === 'string'
        ? backendError?.details
        : backendError?.details
          ? JSON.stringify(backendError?.details)
          : err?.message;
      const errorMessage = backendError?.error || 'Payment initiation failed.';

      MySwal.fire({
        title: 'Payment Failed',
        html: `${errorMessage}${details ? `<br/><small>${details}</small>` : ''}`,
        icon: 'error',
        confirmButtonText: 'Try Again'
      });
      setShowBubbles(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-green-700 tracking-tight">Pay with M-Pesa</h1>
          <p className="mt-2 text-slate-500">Enter your details to receive a payment prompt</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
              <input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm transition focus:ring-2 ${
                  validationErrors.phone ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-green-400'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.phone && <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-2">
              Amount (KES)
            </label>
            <div className="relative">
              <EuroIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="amount"
                type="number"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm transition focus:ring-2 ${
                  validationErrors.amount ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-green-400'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.amount && <p className="mt-1 text-xs text-red-500">{validationErrors.amount}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 text-base font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-300 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay KES ${Number(amount) || 0}`
              )}
            </button>
          </div>
        </form>

        {showBubbles && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-end space-x-3" aria-label="Payment prompt sent, awaiting your confirmation">
              <span className="w-5 h-5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-5 h-5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="w-5 h-5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="w-5 h-5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="w-5 h-5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayWithMpesa;
