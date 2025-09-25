import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInvoiceById } from '../api/invoiceApi';
import { PaymentForm } from './PaymentForm';
import { usePayment } from '../hooks/usePayment';
import { useAuth } from '../../../contexts/AuthContext';

export function PaymentPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentConfirmationCode, setPaymentConfirmationCode] = useState('');
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
                <strong>Amount Paid:</strong> $
                {parseFloat(invoice?.amount || 0).toFixed(2)}
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
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
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
                  ${parseFloat(invoice.amount || 0).toFixed(2)}
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
                  <p><strong>Space:</strong> {invoice.booking.space?.title || 'N/A'}</p>
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
