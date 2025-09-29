import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInvoiceById } from './invoiceApi';
import { PaymentForm } from './PaymentForm';
import { usePayment } from './usePayment';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from './currency';

export function PaymentPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentConfirmationCode, setPaymentConfirmationCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mpesa');
  const { accessToken } = useAuth()

  const {
    validatePayment,
    validating,
    paymentError,
    paymentSuccess,
  } = usePayment(id);

  useEffect(() => {
    if (!accessToken) {
      return
    }    
    fetchInvoiceById(id, accessToken)
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      
  }, [accessToken]);

  const handleValidatePayment = async (e) => {
    e.preventDefault();
    await validatePayment(paymentConfirmationCode);
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentConfirmationCode(''); // Clear confirmation code when switching methods
  };

  if (loading) return <div className="text-center">Loading invoice details...</div>;
  if (error) return <div className="text-center text-red-600">Error: {error}</div>;

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600">Your booking has been confirmed.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Booking Details</h3>
              <p><strong>Invoice ID:</strong> {invoice?.id}</p>
              <p>
                <strong>Amount Paid:</strong> 
                {formatCurrency(invoice?.amount)}
              </p>
              <p><strong>Confirmation Code:</strong> {paymentConfirmationCode}</p>
            </div>

            <Link
              to="/"
              className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 inline-block"
            >
              Return to Spaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Payment</h1>

        {invoice && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Invoice ID:</span>
                <span className="ml-2">{invoice.id}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 capitalize">{invoice.status || 'Pending'}</span>
              </div>
              <div>
                <span className="font-medium">Amount:</span>
                <span className="ml-2 font-bold text-green-600">
                  {formatCurrency(invoice?.amount)}
                </span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">
                  {invoice.created_at
                    ? new Date(invoice.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            {invoice.booking && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Booking Information</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Space:</strong> {invoice.booking.space_title || 'N/A'}</p>
                  <p>
                    <strong>Start:</strong>{' '}
                    {invoice.booking.start_time
                      ? new Date(invoice.booking.start_time).toLocaleString()
                      : 'N/A'}
                  </p>
                  <p>
                    <strong>End:</strong>{' '}
                    {invoice.booking.end_time
                      ? new Date(invoice.booking.end_time).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lipa Na M-Pesa Option */}
            <label className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedPaymentMethod === 'mpesa' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="mpesa"
                checked={selectedPaymentMethod === 'mpesa'}
                onChange={() => handlePaymentMethodChange('mpesa')}
                className="absolute top-3 right-3"
              />
              <img 
                src="/mpesa.png" 
                alt="M-Pesa Logo" 
                className="w-24 h-12 mb-3"
              />
              <div className="text-center">
                <div className="font-medium text-green-600 mb-1">Lipa Na M-Pesa</div>
                <div className="text-xs text-gray-600">Mobile money payment</div>
              </div>
            </label>

            {/* PayPal Option */}
            <label className="relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-50">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                disabled
                className="absolute top-3 right-3"
              />
              <img 
                src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
                alt="PayPal Logo" 
                className="w-12 h-8 mb-3"
              />
              <div className="text-center">
                <div className="font-medium mb-1">PayPal</div>
                <div className="text-xs text-red-500">Unavailable</div>
              </div>
            </label>

            {/* Card Payment Option */}
            <label className="relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-50">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                disabled
                className="absolute top-3 right-3"
              />
              <div className="flex items-center mb-3">
                <img 
                  src="/visa.svg" 
                  alt="Visa Logo" 
                  className="w-10 h-6 mr-2"
                />
                <img 
                  src="/mastercard.svg" 
                  alt="Mastercard Logo" 
                  className="w-10 h-6"
                />
              </div>
              <div className="text-center">
                <div className="font-medium mb-1">Pay with Card</div>
                <div className="text-xs text-red-500">Unavailable</div>
              </div>
            </label>
          </div>
        </div>

        {/* M-Pesa Payment Instructions */}
        {selectedPaymentMethod === 'mpesa' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-2">M-Pesa Payment Instructions</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>1. Go to M-Pesa menu on your phone</p>
              <p>2. Select "Lipa Na M-Pesa"</p>
              <p>3. Select "Pay Bill"</p>
              <p><strong>Business Number:</strong> 247247</p>
              <p><strong>Account Number:</strong> booking</p>
              <p><strong>Amount:</strong> {formatCurrency(invoice.amount)}</p>
              <p>4. Enter your M-Pesa PIN and confirm</p>
              <p>5. You will receive an SMS confirmation with a transaction code</p>
              <p>6. Enter the transaction code below to complete your booking</p>
            </div>
          </div>
        )}

        <PaymentForm
          paymentConfirmationCode={paymentConfirmationCode}
          setPaymentConfirmationCode={setPaymentConfirmationCode}
          validating={validating}
          paymentError={paymentError}
          handleValidatePayment={handleValidatePayment}
        />
      </div>
    </div>
  );
}