import React, { useState } from 'react';

export function Trial() {
  const [formData, setFormData] = useState({
    arrivalDate: '2020-04-17',
    arrivalTime: '06:40',
    checkoutDate: '2020-04-17',
    checkoutTime: '06:40',
    numberOfGuests: '2',
    amountToCharge: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Header Images */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="w-16 h-12 bg-yellow-100 rounded overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center">
              <div className="w-8 h-6 bg-yellow-400 rounded"></div>
            </div>
          </div>
          <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="w-10 h-4 bg-white rounded"></div>
            </div>
          </div>
          <div className="w-16 h-12 bg-blue-100 rounded overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-300 to-blue-500"></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Hotel Booking</h1>
          <p className="text-sm text-gray-600">Experience something new every moment</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Arrival Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arrival Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Checkout Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checkout Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.checkoutDate}
                onChange={(e) => handleInputChange('checkoutDate', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <input
                type="time"
                value={formData.checkoutTime}
                onChange={(e) => handleInputChange('checkoutTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Number of Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.numberOfGuests}
              onChange={(e) => handleInputChange('numberOfGuests', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g. 2"
            />
          </div>

          {/* Amount to be charged */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to be charged
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.amountToCharge}
                onChange={(e) => handleInputChange('amountToCharge', e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mt-6"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}