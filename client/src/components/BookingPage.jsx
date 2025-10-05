import { useBooking } from './useBooking';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSpaceById } from './bookingApi';
import { calculateTotalAmount } from './utils';
import { BookingForm } from './BookingForm';
import { formatCurrency } from './currency';

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
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
    await proceedToBooking({ startDate, endDate, startTime, endTime, termsAccepted, guests });
  };

  if (loading) return <div className="text-center py-12 px-4">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-12 px-4">Error: {error}</div>;

  const totalAmount = calculateTotalAmount({
    startDate,
    endDate,
    startTime,
    endTime,
    pricePerHour: space?.price_per_hour
  });

  const images = space?.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Book: {space?.title}</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">{space?.location}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-1 space-y-6 sm:space-y-8">
            {/* Images Section */}
            {hasImages && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={images[selectedImageIndex]?.url || images[selectedImageIndex]}
                    alt={`${space?.title} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Image+Not+Found';
                    }}
                  />

                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      >
                        →
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="p-3 sm:p-4 bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition ${
                            index === selectedImageIndex ? 'border-green-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image?.url || image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=No+Image';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Space Details */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
                  <div className="text-xs sm:text-sm text-gray-600">Space Type</div>
                  <div className="text-xl sm:text-2xl font-semibold text-green-600">{space?.space_type}</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                  <div className="text-xs sm:text-sm text-gray-600">Max Guests</div>
                  <div className="text-xl sm:text-2xl font-semibold text-blue-600">{space?.max_guests}</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl">
                  <div className="text-xs sm:text-sm text-gray-600">Price Per Hour</div>
                  <div className="text-xl sm:text-2xl font-semibold text-purple-600">
                    {formatCurrency(space?.price_per_hour)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Reserve Your Space</h2>

                {/* Inline Booking Error Display */}
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Booking Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          {bookingError}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {totalAmount > 0 && (
                  <div className="bg-green-50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Total Amount:</span>
                      <span className="text-xl sm:text-2xl font-bold text-green-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                )}

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
          </div>
        </div>
      </div>
    </div>
  );
}