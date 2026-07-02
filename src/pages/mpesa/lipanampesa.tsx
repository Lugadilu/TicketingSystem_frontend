// src/pages/mpesa/lipanampesa.tsx
// Pay with M-Pesa page.
// Uses apiClient (via mpesaApi) so the JWT token is sent automatically.
// Socket.io is kept for real-time callback updates — connect only after
// a successful STK push so we don't open idle sockets.

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Loader2, Smartphone, DollarSign, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import type { Socket as SocketType } from 'socket.io-client';
import { initiateStkPush } from '../../services/mpesaApi';

const MySwal = withReactContent(Swal);

const PayWithMpesa = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    phone?: string;
    amount?: string;
  }>({});

  // Socket and timer refs — cleaned up on unmount
  const socketRef = useRef<SocketType | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const hardTimeoutRef = useRef<number | null>(null);

  // VITE_SOCKET_URL should point to your backend root (not /api)
  // e.g. VITE_SOCKET_URL=http://localhost:5072
  // If not set, we derive it from the API base URL by stripping /api
  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:5072';

  const validateInputs = (): boolean => {
    const errors: { phone?: string; amount?: string } = {};

    if (!/^(01|07)\d{8}$/.test(phone)) {
      errors.phone = 'Enter a valid 10-digit number (e.g. 0712345678)';
    }

    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      errors.amount = 'Enter a valid amount greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearTimers = () => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    if (hardTimeoutRef.current) window.clearTimeout(hardTimeoutRef.current);
    pendingTimerRef.current = null;
    hardTimeoutRef.current = null;
  };

  // Disconnect socket and clear timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      socketRef.current?.disconnect();
    };
  }, []);

  const connectSocket = (): SocketType => {
    if (socketRef.current?.connected) return socketRef.current;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    return socketRef.current;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors({});
    if (!validateInputs()) return;

    setLoading(true);
    setShowBubbles(false);

    // Show processing modal immediately so the user knows something is happening
    MySwal.fire({
      title: 'Sending Payment Prompt…',
      text: 'Please wait while we send the request to Safaricom.',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    try {
      const numericAmount = Number(amount);

      // ── Key change ──────────────────────────────────────────────────────────
      // We now call our typed mpesaApi function instead of raw axios.
      // This uses the shared apiClient which attaches the JWT token automatically.
      // The backend normalizes the phone number so we pass it as-is.
      // ────────────────────────────────────────────────────────────────────────
      const result = await initiateStkPush(
        phone,                  // e.g. "0712345678" — backend normalizes to 254...
        numericAmount,
        'TicketPayment',        // accountReference — customize per use case
        'Ticket service payment'
      );

      if (!result.success) {
        throw new Error(result.message || 'STK Push failed');
      }

      const { CheckoutRequestID } = result.data;

      Swal.close();
      setPhone('');
      setAmount('');
      setShowBubbles(true);

      // ── Socket: listen for real-time callback result ─────────────────────
      // Your backend needs to emit 'transaction_update' on this socket room
      // when the Daraja callback arrives. If you haven't added socket.io to
      // your .NET backend yet, the fallback hard-timeout will handle it.
      const socket = connectSocket();
      socket.off('transaction_update');
      socket.emit('join_checkout', { checkoutRequestId: CheckoutRequestID });

      // Soft reminder after 45s if no response yet
      pendingTimerRef.current = window.setTimeout(() => {
        MySwal.fire({
          title: 'Still Pending…',
          text: 'If you have not received the STK prompt, check that your SIM is active and try again.',
          icon: 'info',
          confirmButtonText: 'OK',
        });
      }, 45_000);

      // Hard fallback after 3 minutes — Daraja callbacks usually arrive in <10s
      hardTimeoutRef.current = window.setTimeout(() => {
        setShowBubbles(false);
        MySwal.fire({
          title: 'Payment Timeout',
          text: 'We did not receive a response from Safaricom. Please try again.',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }, 180_000);

      socket.on('transaction_update', (payload: any) => {
        clearTimers();
        setShowBubbles(false);
        Swal.close();

        const status: string = payload?.status || 'failure';

        if (status === 'success') {
          MySwal.fire({
            title: 'Payment Successful',
            text: `KES ${payload?.amount ?? numericAmount} received. Receipt: ${payload?.receipt ?? 'N/A'}`,
            icon: 'success',
            confirmButtonText: 'Done',
          });
        } else if (status === 'cancelled') {
          MySwal.fire({ title: 'Payment Cancelled', text: 'You cancelled the payment.', icon: 'error', confirmButtonText: 'OK' });
        } else if (status === 'wrong_pin') {
          MySwal.fire({ title: 'Wrong PIN', text: 'Incorrect PIN entered. Please try again.', icon: 'error', confirmButtonText: 'Retry' });
        } else if (status === 'insufficient_funds') {
          MySwal.fire({ title: 'Insufficient Funds', text: 'Your M-Pesa balance is too low for this transaction.', icon: 'error', confirmButtonText: 'OK' });
        } else if (status === 'timeout') {
          MySwal.fire({ title: 'Request Timed Out', text: 'The payment request expired. Please try again.', icon: 'warning', confirmButtonText: 'OK' });
        } else {
          MySwal.fire({ title: 'Payment Failed', text: payload?.resultDesc || 'Payment could not be completed.', icon: 'error', confirmButtonText: 'OK' });
        }
      });

    } catch (err: any) {
      Swal.close();
      setShowBubbles(false);

      // Extract the most useful error message from the backend response
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        'Payment initiation failed.';

      MySwal.fire({
        title: 'Payment Failed',
        text: backendMessage,
        icon: 'error',
        confirmButtonText: 'Try Again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 relative">
        {/* X Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-green-700 tracking-tight">
            Pay with M-Pesa
          </h1>
          <p className="mt-2 text-slate-500">
            Enter your details to receive a payment prompt on your phone
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Phone number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm transition focus:outline-none focus:ring-2 ${
                  validationErrors.phone
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-300 focus:ring-green-400'
                }`}
              />
            </div>
            {validationErrors.phone && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-2">
              Amount (KES)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="amount"
                type="number"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                min={1}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm transition focus:outline-none focus:ring-2 ${
                  validationErrors.amount
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-300 focus:ring-green-400'
                }`}
              />
            </div>
            {validationErrors.amount && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.amount}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 text-base font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all focus:ring-4 focus:ring-green-300 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              `Pay KES ${Number(amount) || 0}`
            )}
          </button>
        </form>

        {/* Animated bubbles shown while waiting for callback */}
        {showBubbles && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-3">
              Check your phone and enter your M-Pesa PIN to complete payment
            </p>
            <div className="flex items-end justify-center space-x-3">
              {['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'].map(
                (color, i) => (
                  <span
                    key={color}
                    className={`w-5 h-5 rounded-full ${color} animate-bounce`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayWithMpesa;




// // src/pages/mpesa/lipanampesa.tsx
// // Pay with M-Pesa page.
// // Uses apiClient (via mpesaApi) so the JWT token is sent automatically.
// // Socket.io is kept for real-time callback updates — connect only after
// // a successful STK push so we don't open idle sockets.

// import { useState, useRef, useEffect } from 'react';
// import type { FormEvent } from 'react';
// import Swal from 'sweetalert2';
// import withReactContent from 'sweetalert2-react-content';
// import { Loader2, Smartphone, DollarSign } from 'lucide-react';
// import { io, Socket } from 'socket.io-client';
// import type { Socket as SocketType } from 'socket.io-client';
// import { initiateStkPush } from '../../services/mpesaApi';

// const MySwal = withReactContent(Swal);

// const PayWithMpesa = () => {
//   const [phone, setPhone] = useState('');
//   const [amount, setAmount] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showBubbles, setShowBubbles] = useState(false);
//   const [validationErrors, setValidationErrors] = useState<{
//     phone?: string;
//     amount?: string;
//   }>({});

//   // Socket and timer refs — cleaned up on unmount
//   const socketRef = useRef<SocketType | null>(null);
//   const pendingTimerRef = useRef<number | null>(null);
//   const hardTimeoutRef = useRef<number | null>(null);

//   // VITE_SOCKET_URL should point to your backend root (not /api)
//   // e.g. VITE_SOCKET_URL=http://localhost:5072
//   // If not set, we derive it from the API base URL by stripping /api
//   const SOCKET_URL =
//     import.meta.env.VITE_SOCKET_URL ||
//     'http://localhost:5072';

//   const validateInputs = (): boolean => {
//     const errors: { phone?: string; amount?: string } = {};

//     if (!/^(01|07)\d{8}$/.test(phone)) {
//       errors.phone = 'Enter a valid 10-digit number (e.g. 0712345678)';
//     }

//     const num = Number(amount);
//     if (isNaN(num) || num <= 0) {
//       errors.amount = 'Enter a valid amount greater than 0';
//     }

//     setValidationErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const clearTimers = () => {
//     if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
//     if (hardTimeoutRef.current) window.clearTimeout(hardTimeoutRef.current);
//     pendingTimerRef.current = null;
//     hardTimeoutRef.current = null;
//   };

//   // Disconnect socket and clear timers on unmount
//   useEffect(() => {
//     return () => {
//       clearTimers();
//       socketRef.current?.disconnect();
//     };
//   }, []);

//   const connectSocket = (): SocketType => {
//     if (socketRef.current?.connected) return socketRef.current;
//     socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
//     return socketRef.current;
//   };

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setValidationErrors({});
//     if (!validateInputs()) return;

//     setLoading(true);
//     setShowBubbles(false);

//     // Show processing modal immediately so the user knows something is happening
//     MySwal.fire({
//       title: 'Sending Payment Prompt…',
//       text: 'Please wait while we send the request to Safaricom.',
//       icon: 'info',
//       allowOutsideClick: false,
//       showConfirmButton: false,
//     });

//     try {
//       const numericAmount = Number(amount);

//       // ── Key change ──────────────────────────────────────────────────────────
//       // We now call our typed mpesaApi function instead of raw axios.
//       // This uses the shared apiClient which attaches the JWT token automatically.
//       // The backend normalizes the phone number so we pass it as-is.
//       // ────────────────────────────────────────────────────────────────────────
//       const result = await initiateStkPush(
//         phone,                  // e.g. "0712345678" — backend normalizes to 254...
//         numericAmount,
//         'TicketPayment',        // accountReference — customize per use case
//         'Ticket service payment'
//       );

//       if (!result.success) {
//         throw new Error(result.message || 'STK Push failed');
//       }

//       const { CheckoutRequestID } = result.data;

//       Swal.close();
//       setPhone('');
//       setAmount('');
//       setShowBubbles(true);

//       // ── Socket: listen for real-time callback result ─────────────────────
//       // Your backend needs to emit 'transaction_update' on this socket room
//       // when the Daraja callback arrives. If you haven't added socket.io to
//       // your .NET backend yet, the fallback hard-timeout will handle it.
//       const socket = connectSocket();
//       socket.off('transaction_update');
//       socket.emit('join_checkout', { checkoutRequestId: CheckoutRequestID });

//       // Soft reminder after 45s if no response yet
//       pendingTimerRef.current = window.setTimeout(() => {
//         MySwal.fire({
//           title: 'Still Pending…',
//           text: 'If you have not received the STK prompt, check that your SIM is active and try again.',
//           icon: 'info',
//           confirmButtonText: 'OK',
//         });
//       }, 45_000);

//       // Hard fallback after 3 minutes — Daraja callbacks usually arrive in <10s
//       hardTimeoutRef.current = window.setTimeout(() => {
//         setShowBubbles(false);
//         MySwal.fire({
//           title: 'Payment Timeout',
//           text: 'We did not receive a response from Safaricom. Please try again.',
//           icon: 'warning',
//           confirmButtonText: 'OK',
//         });
//       }, 180_000);

//       socket.on('transaction_update', (payload: any) => {
//         clearTimers();
//         setShowBubbles(false);
//         Swal.close();

//         const status: string = payload?.status || 'failure';

//         if (status === 'success') {
//           MySwal.fire({
//             title: 'Payment Successful',
//             text: `KES ${payload?.amount ?? numericAmount} received. Receipt: ${payload?.receipt ?? 'N/A'}`,
//             icon: 'success',
//             confirmButtonText: 'Done',
//           });
//         } else if (status === 'cancelled') {
//           MySwal.fire({ title: 'Payment Cancelled', text: 'You cancelled the payment.', icon: 'error', confirmButtonText: 'OK' });
//         } else if (status === 'wrong_pin') {
//           MySwal.fire({ title: 'Wrong PIN', text: 'Incorrect PIN entered. Please try again.', icon: 'error', confirmButtonText: 'Retry' });
//         } else if (status === 'insufficient_funds') {
//           MySwal.fire({ title: 'Insufficient Funds', text: 'Your M-Pesa balance is too low for this transaction.', icon: 'error', confirmButtonText: 'OK' });
//         } else if (status === 'timeout') {
//           MySwal.fire({ title: 'Request Timed Out', text: 'The payment request expired. Please try again.', icon: 'warning', confirmButtonText: 'OK' });
//         } else {
//           MySwal.fire({ title: 'Payment Failed', text: payload?.resultDesc || 'Payment could not be completed.', icon: 'error', confirmButtonText: 'OK' });
//         }
//       });

//     } catch (err: any) {
//       Swal.close();
//       setShowBubbles(false);

//       // Extract the most useful error message from the backend response
//       const backendMessage =
//         err?.response?.data?.message ||
//         err?.response?.data?.Message ||
//         err?.message ||
//         'Payment initiation failed.';

//       MySwal.fire({
//         title: 'Payment Failed',
//         text: backendMessage,
//         icon: 'error',
//         confirmButtonText: 'Try Again',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-gradient-to-br from-green-50 to-white min-h-screen flex items-center justify-center p-4 font-sans">
//       <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
//         <div className="text-center mb-10">
//           <h1 className="text-3xl font-semibold text-green-700 tracking-tight">
//             Pay with M-Pesa
//           </h1>
//           <p className="mt-2 text-slate-500">
//             Enter your details to receive a payment prompt on your phone
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} noValidate className="space-y-6">
//           {/* Phone number */}
//           <div>
//             <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
//               M-Pesa Phone Number
//             </label>
//             <div className="relative">
//               <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//               <input
//                 id="phone"
//                 type="tel"
//                 placeholder="0712345678"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 disabled={loading}
//                 className={`w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm transition focus:outline-none focus:ring-2 ${
//                   validationErrors.phone
//                     ? 'border-red-400 focus:ring-red-300'
//                     : 'border-slate-300 focus:ring-green-400'
//                 }`}
//               />
//             </div>
//             {validationErrors.phone && (
//               <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
//             )}
//           </div>

//           {/* Amount */}
//           <div>
//             <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-2">
//               Amount (KES)
//             </label>
//             <div className="relative">
//               <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//               <input
//                 id="amount"
//                 type="number"
//                 placeholder="e.g. 100"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 disabled={loading}
//                 min={1}
//                 className={`w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm transition focus:outline-none focus:ring-2 ${
//                   validationErrors.amount
//                     ? 'border-red-400 focus:ring-red-300'
//                     : 'border-slate-300 focus:ring-green-400'
//                 }`}
//               />
//             </div>
//             {validationErrors.amount && (
//               <p className="mt-1 text-xs text-red-500">{validationErrors.amount}</p>
//             )}
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full flex items-center justify-center py-3 px-4 text-base font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all focus:ring-4 focus:ring-green-300 disabled:bg-green-300 disabled:cursor-not-allowed"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//                 Processing…
//               </>
//             ) : (
//               `Pay KES ${Number(amount) || 0}`
//             )}
//           </button>
//         </form>

//         {/* Animated bubbles shown while waiting for callback */}
//         {showBubbles && (
//           <div className="mt-8 text-center">
//             <p className="text-sm text-slate-500 mb-3">
//               Check your phone and enter your M-Pesa PIN to complete payment
//             </p>
//             <div className="flex items-end justify-center space-x-3">
//               {['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'].map(
//                 (color, i) => (
//                   <span
//                     key={color}
//                     className={`w-5 h-5 rounded-full ${color} animate-bounce`}
//                     style={{ animationDelay: `${i * 100}ms` }}
//                   />
//                 )
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PayWithMpesa;



