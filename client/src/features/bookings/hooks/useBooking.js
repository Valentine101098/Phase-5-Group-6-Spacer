import { useState } from 'react';
import { createBooking } from '../api/bookingApi';
import { calculateTotalAmount } from '../utils/utils';

export function useBooking(space, id, navigate) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const proceedToBooking = async ({ startDate, endDate, startTime, endTime, termsAccepted }) => {
    if (!termsAccepted) {
      throw new Error('Please accept the terms and conditions');
    }

    setSubmitting(true);
    setError(null);

    try {
      const totalAmount = calculateTotalAmount({
        startDate,
        endDate,
        startTime,
        endTime,
        pricePerHour: space.price_per_hour
      });

      const bookingData = {
        space_id: parseInt(id),
        agreement_template_id: space.agreement.template_id,
        start_time: `${startDate}T${startTime}:00`,
        end_time: `${endDate}T${endTime}:00`,
        total_amount: totalAmount.toFixed(2),
        terms_accepted: termsAccepted
      };

      const result = await createBooking(bookingData);
      const invoiceId = result.data.invoice.id;
      navigate(`/invoices/${invoiceId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return { proceedToBooking, submitting, error };
}
