import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSpaceById } from '../api/bookingApi';
import { calculateTotalAmount } from '../utils/utils';
import { BookingForm } from './BookingForm';
import { useBooking } from '../hooks/useBooking';

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { proceedToBooking, submitting, error: bookingError } = useBooking(space, id, navigate);

  useEffect(() => {
    fetchSpaceById(id)
      .then(setSpace)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (startDate && !endDate) {
      setEndDate(startDate);
    }
  }, [startDate]);

  const handleProceed = async (e) => {
    e.preventDefault();
    await proceedToBooking({ startDate, endDate, startTime, endTime, termsAccepted });
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-600">Error: {error}</div>;
  if (bookingError) return <div className="text-center text-red-600">Error: {bookingError}</div>;

  const totalAmount = calculateTotalAmount({
    startDate,
    endDate,
    startTime,
    endTime,
    pricePerHour: space?.price_per_hour
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Book: {space?.title}</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">{space?.space_type}</span>
            <span className="text-xl font-bold text-green-600">
              ${parseFloat(space?.price_per_hour || 0).toFixed(2)}/hr
            </span>
          </div>
          <p className="text-gray-600 mt-2">Max guests: {space?.max_guests}</p>
          {totalAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center font-bold">
                <span>Total Amount:</span>
                <span className="text-2xl text-green-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <BookingForm
          id={id}
          space={space}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          guests={guests}
          setGuests={setGuests}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          submitting={submitting}
          totalAmount={totalAmount}
          handleProceed={handleProceed}
        />
      </div>
    </div>
  );
}
