import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function ReviewFormModal({ spaceId, bookingId, onClose, onReviewAdded }) {
  const { user, accessToken } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // fetch last 5 reviews
  const fetchReviews = () => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/reviews/spaces${spaceId}?limit=5`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return res.json();
      })
      .then((data) => {
        setReviews(Array.isArray(data) ? data.filter(Boolean) : []);
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // fetch logged-in user's review
  const fetchUserReview = () => {
    if (!user || !accessToken) return;

    fetch(`${API_BASE_URL}/api/reviews/spaces/${spaceId}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch user review");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUserReview(data);
          setRating(data.rating);
          setComment(data.comment);
        }
      })
      .catch((err) => console.error("Error fetching user review:", err));
  };

  useEffect(() => {
    if (spaceId) {
      fetchReviews();
      fetchUserReview();
    }
  }, [spaceId]);

  // submit review
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    const activeReview = editingReview || userReview;
    const method = activeReview ? "PATCH" : "POST";
    const url = activeReview
      ? `${API_BASE_URL}/api/reviews/${activeReview.id}`
      : `${API_BASE_URL}/api/reviews/`;

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        booking_id: activeReview?.booking_id || bookingId,
        rating,
        comment,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to submit review");
        return res.json();
      })
      .then((newReview) => {
        if (activeReview) {
          setReviews((prev) => prev.map((r) => (r.id === newReview.id ? newReview : r)));
        } else {
          setReviews((prev) => [newReview, ...prev]);
        }
        setUserReview(newReview);
        setEditingReview(null);

        if (onReviewAdded) onReviewAdded(newReview);

        setSubmitting(false);
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      })
      .catch((err) => {
        console.error("Error submitting review:", err);
        setSubmitting(false);
        setError("Failed to submit review. Please try again.");
      });
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
            <p className="text-lg font-semibold text-green-600">
              Review submitted successfully!
            </p>
          </div>
        ) : submitting ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-lg font-medium text-gray-600">
              Submitting your review...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {editingReview || userReview ? "Edit Your Review" : "Add Your Review"}
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
              <form onSubmit={handleSubmit} className="mt-4 bg-blue-600 flex flex-col gap-2 p-4 rounded-xl">
                <label className="font-semibold text-white">Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="border p-2 rounded"
                  disabled={submitting}
                />

                <label className="font-semibold text-white">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border p-2 rounded mb-2"
                  disabled={submitting}
                ></textarea>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-900 transition disabled:opacity-50"
                >
                  {editingReview || userReview ? "Update Review" : "Submit Review"}
                </button>

                {(editingReview || userReview) && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition mt-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
