
export function BookingForm({
  id,
  space,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  guests,
  setGuests,
  termsAccepted,
  setTermsAccepted,
  submitting,
  handleProceed,
}) {
  return (
    <form onSubmit={handleProceed} className="space-y-6">
      {/* Start Date & Time */}
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          Start Date & Time
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 hover:bg-white"
              required
            />
            <span className="absolute top-3 right-3 text-gray-400 pointer-events-none">
              📅
            </span>
          </div>
          <div className="relative">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 hover:bg-white"
              required
            />
            <span className="absolute top-3 right-3 text-gray-400 pointer-events-none">
              🕐
            </span>
          </div>
        </div>
      </div>

      {/* End Date & Time */}
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          End Date & Time
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 hover:bg-white"
              required
            />
            <span className="absolute top-3 right-3 text-gray-400 pointer-events-none">
              📅
            </span>
          </div>
          <div className="relative">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 hover:bg-white"
              required
            />
            <span className="absolute top-3 right-3 text-gray-400 pointer-events-none">
              🕐
            </span>
          </div>
        </div>
      </div>

      {/* Number of Guests */}
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          Number of Guests
        </label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max={space?.max_guests}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 hover:bg-white"
            required
          />
          <span className="absolute top-3 right-3 text-gray-400 pointer-events-none">
            👥
          </span>
          <div className="mt-2 text-xs text-gray-500">
            Maximum: {space?.max_guests} guests
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <label className="block text-sm font-semibold text-gray-800">
          Rental Agreement Terms
        </label>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border max-h-48 overflow-y-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {space?.agreement?.terms || `RENTAL AGREEMENT TERMS

1. BOOKING AND PAYMENT
   • Full payment required upon booking confirmation
   • Cancellations must be made 24 hours in advance
   • No-shows will be charged the full amount

2. SPACE USAGE
   • Respect the maximum guest capacity
   • No smoking or pets allowed unless specified
   • Clean up after use - additional cleaning fees may apply

3. LIABILITY
   • Renter assumes responsibility for damages
   • Host not liable for personal belongings
   • Insurance coverage recommended

4. CONDUCT
   • Maintain reasonable noise levels
   • Follow all building rules and regulations
   • Be courteous to neighbors and other tenants`}
          </pre>
        </div>
        <div className="flex items-start bg-green-50 p-3 rounded-xl">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 mr-3 w-5 h-5 rounded border-2 border-green-300 text-green-600 focus:ring-green-500 focus:ring-2"
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-800 font-medium">
            I have read and agree to the rental agreement terms above
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors border border-gray-200"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={!termsAccepted || submitting}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
            termsAccepted && !submitting
              ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Booking...
            </div>
          ) : (
            "Proceed to Payment →"
          )}
        </button>
      </div>
    </form>
  );
}