import { Link } from 'react-router-dom';

export function PaymentForm({
  paymentConfirmationCode,
  setPaymentConfirmationCode,
  validating,
  paymentError,
  handleValidatePayment,
}) {
  return (
    <form onSubmit={handleValidatePayment} className="space-y-4">
      <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Payment Confirmation Code
        </label>
        <input
          type="text"
          value={paymentConfirmationCode}
          onChange={(e) => setPaymentConfirmationCode(e.target.value)}
          placeholder="Enter your payment confirmation code"
          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base sm:text-lg"
          disabled={validating}
          required
        />
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Enter the confirmation code you received after making the payment
        </p>
      </div>

      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{paymentError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <Link
          to="/"
          className="bg-gray-600 text-white py-2 px-4 sm:py-3 sm:px-6 rounded hover:bg-gray-700 text-center text-sm sm:text-base"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={validating || !paymentConfirmationCode.trim()}
          className={`flex-1 py-2 px-4 sm:py-3 sm:px-6 rounded font-medium text-sm sm:text-base ${
            !validating && paymentConfirmationCode.trim()
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {validating ? 'Validating Payment...' : 'Validate Payment'}
        </button>
      </div>
    </form>
  );
}