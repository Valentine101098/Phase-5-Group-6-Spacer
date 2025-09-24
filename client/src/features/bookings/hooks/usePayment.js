// features/temp/usePayment.js
import { useState } from 'react';
import { validateInvoicePayment } from '../api/invoiceApi';
import { useAuth } from '../../../contexts/AuthContext';

export function usePayment(invoiceId) {
  const [validating, setValidating] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { accessToken } = useAuth() 

  const validatePayment = async (confirmationCode) => {
    if (!confirmationCode.trim()) {
      setPaymentError('Please enter a payment confirmation code');
      return;
    }

    setValidating(true);
    setPaymentError(null);

    try {
      await validateInvoicePayment(invoiceId, confirmationCode.trim(), accessToken);
      setPaymentSuccess(true);
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setValidating(false);
    }
  };

  return { validatePayment, validating, paymentError, paymentSuccess };
}
