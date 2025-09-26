import { useState, useEffect } from "react";
import SpaceReviewForm from "./SpaceReviewForm";
import { useAuth } from "../contexts/AuthContext";
import { X, CheckCircle, Loader2, AlertCircle } from "lucide-react";

export default function ReviewFormModal({ spaceId, bookingId, onClose, onReviewAdded }) {
  const { user, accessToken } = useAuth();
  const [editingReview, setEditingReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // fetch existing reviews for this space
  const fetchReviews = () => {
    setLoading(true);
    setError(null);
    
    fetch(`http://127.0.0.1:5000/api/reviews/spaces/${spaceId}?limit=5`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch reviews');
        }
        return res.json();
      })
      .then((data) => {
        setReviews(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (spaceId) {
      fetchReviews();
    }
  }, [spaceId]);

  // find if user already reviewed
  const userReview = reviews.find((r) => r.user_id === user?.id);

  const handleReviewSubmitted = (newReview) => {
    setSubmitting(true);
    
    // Simulate API call delay for better UX
    setTimeout(() => {
      if (editingReview) {
        setReviews(reviews.map((r) => (r.id === newReview.id ? newReview : r)));
        setEditingReview(null);
      } else {
        setReviews([newReview, ...reviews]);
      }
      
      if (onReviewAdded) onReviewAdded(newReview);

      setSubmitting(false);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 500);
  };

  const handleReviewError = (errorMessage) => {
    setSubmitting(false);
    setError(errorMessage || "Failed to submit review. Please try again.");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 disabled:opacity-50"
          disabled={submitting}
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-lg font-semibold text-green-600">Review submitted successfully!</p>
          </div>
        ) : submitting ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-lg font-medium text-gray-600">Submitting your review...</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {editingReview ? "Edit Your Review" : "Add Your Review"}
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-600">Loading reviews...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={fetchReviews}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <SpaceReviewForm
                spaceId={spaceId}
                booking_id={bookingId}
                editingReview={editingReview || userReview}
                onReviewSubmitted={handleReviewSubmitted}
                onReviewError={handleReviewError}
                onCancel={onClose}
                isSubmitting={submitting}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}