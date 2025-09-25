import { Link } from "react-router-dom";

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
    <form onSubmit={handleProceed} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded-2xl shadow">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>
        <div className="p-4 bg-white rounded-2xl shadow">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded-2xl shadow">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>
        <div className="p-4 bg-white rounded-2xl shadow">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Number of Guests
        </label>
        <input
          type="number"
          min="1"
          max={space?.max_guests}
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value))}
          className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div className="p-4 bg-white rounded-2xl shadow space-y-3">
        <label className="block text-sm font-semibold text-gray-800">
          Rental Agreement Terms
        </label>
        <div className="bg-gray-50 p-3 rounded-lg border max-h-48 overflow-y-auto">
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
            {space?.agreement?.terms || "Loading agreement terms..."}
          </pre>
        </div>
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 mr-2 rounded border-gray-400 text-green-600 focus:ring-green-500"
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the rental agreement terms above
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Link
          to={`/spaces/${id}`}
          className="bg-gray-200 text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-300 transition"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={!termsAccepted || submitting}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition ${
            termsAccepted && !submitting
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submitting ? "Creating Booking..." : "Proceed to Payment"}
        </button>
      </div>
    </form>
  );
}
