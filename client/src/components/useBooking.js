// ADD THIS IMPORT AT THE TOP:
import { useState } from 'react';
import { createBooking } from './bookingApi';
import { calculateTotalAmount } from './utils';
import { useAuth } from '../contexts/AuthContext';

export function useBooking(space, id, navigate) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken } = useAuth();

  const proceedToBooking = async ({ startDate, endDate, startTime, endTime, termsAccepted, guests = 1 }) => {
    if (!termsAccepted) {
      throw new Error('Please accept the terms and conditions');
    }

    if (!space) {
      throw new Error('Space information not loaded');
    }

    // DATE VALIDATION
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    
    if (startDateTime <= now) {
      throw new Error('Booking start time must be in the future');
    }

    if (endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }

    setSubmitting(true);
    setError(null);

    try {
      const templateId = space.template_id || space.agreement?.template_id;
      
      if (!templateId) {
        throw new Error('Space configuration error: Missing agreement template. Please contact support.');
      }

      const totalAmount = calculateTotalAmount({
        startDate,
        endDate,
        startTime,
        endTime,
        pricePerHour: space.price_per_hour
      });

      const bookingData = {
        space_id: parseInt(id),
        agreement_template_id: templateId,
        start_time: `${startDate}T${startTime}:00Z`,
        end_time: `${endDate}T${endTime}:00Z`,
        total_amount: totalAmount.toFixed(2),
        estimated_guests: guests,
        terms_accepted: termsAccepted
      };

      console.log('Booking payload dates:', {
        start: bookingData.start_time,
        end: bookingData.end_time,
        now: new Date().toISOString()
      });

      const result = await createBooking(bookingData, accessToken);
      
      if (result && result.data && result.data.invoice) {
        const invoiceId = result.data.invoice.id;
        navigate(`/payment/${invoiceId}`);
      } else {
        throw new Error('Invalid response from booking creation');
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { proceedToBooking, submitting, error };
}