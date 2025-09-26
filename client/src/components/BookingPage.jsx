import { useBooking } from './useBooking';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSpaceById } from './bookingApi';
import { calculateTotalAmount } from './utils';
import { BookingForm } from './BookingForm';

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-12">Error: {error}</div>;
  if (bookingError) return <div className="text-center text-red-600 py-12">Error: {bookingError}</div>;

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book: {space?.title}</h1>
          <p className="text-lg text-gray-600">{space?.location}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Images Section */}
            {hasImages && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={images[selectedImageIndex]?.url || images[selectedImageIndex]}
                    alt={`${space?.title} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Image+Not+Found';
                    }}
                  />
                  
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      >
                        →
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
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
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Rating Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {'★'.repeat(5).split('').map((star, i) => (
                        <span key={i} className={i < Math.floor(4.7) ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-2xl font-bold text-gray-900">4.7</span>
                    <span className="text-gray-600 ml-2">(127 reviews)</span>
                  </div>
                </div>

                {/* Featured Review */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                      SM
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">Sarah Martinez</span>
                        <span className="text-sm text-gray-500">• 2 weeks ago</span>
                        <div className="flex text-yellow-400 text-sm">
                          {'★'.repeat(5)}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        "Absolutely perfect space for our team retreat! The natural lighting was amazing and the location was super convenient. The host was incredibly responsive and made sure everything was set up exactly as we needed. Would definitely book again!"
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <button className="flex items-center gap-1 hover:text-gray-800">
                          👍 12
                        </button>
                        <span>Helpful</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{space?.space_type}</div>
                  <div className="text-sm text-gray-600">Space Type</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{space?.max_guests}</div>
                  <div className="text-sm text-gray-600">Max Guests</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    ${parseFloat(space?.price_per_hour || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Per Hour</div>
                </div>
              </div>

              {/* Description */}
              {space?.description && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Space</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {space.description}
                    </p>
                  </div>
                </div>
              )}
              

              {/* Amenities */}
              {space?.amenities && space.amenities.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {space.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reserve Your Space</h2>
                
                {totalAmount > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${totalAmount.toFixed(2)}
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

