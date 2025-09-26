import { useState, useEffect } from "react";
import SpaceReviewForm from "./SpaceReviewForm";
import { useAuth } from "../contexts/AuthContext";
import { X, CheckCircle } from "lucide-react";

export default function ReviewFormModal({ spaceId, bookingId, onClose, onReviewAdded }) {
  const { user, accessToken } = useAuth();
  const [editingReview, setEditingReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [success, setSuccess] = useState(false);

  // fetch existing reviews for this space -pending work
  const fetchReviews = () => {
    fetch(`http://127.0.0.1:5000/api/reviews/spaces/${spaceId}?limit=5`)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error("Error fetching reviews:", err));
  };

  useEffect(() => {
    if (spaceId) {
      fetchReviews();
    }
  }, [spaceId]);

  // find if user already reviewed
  const userReview = reviews.find((r) => r.user_id === user?.id);

  const handleReviewSubmitted = (newReview) => {
    if (editingReview) {
      setReviews(reviews.map((r) => (r.id === newReview.id ? newReview : r)));
      setEditingReview(null);
    } else {
      setReviews([newReview, ...reviews]);
    }
    if (onReviewAdded) onReviewAdded(newReview);

    
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-lg font-semibold text-green-600">Review submitted successfully!</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {editingReview ? "Edit Your Review" : "Add Your Review"}
            </h2>

            <SpaceReviewForm
              spaceId={spaceId}
              booking_id={bookingId}
              editingReview={editingReview || userReview}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={onClose}
            />
          </>
        )}
      </div>
    </div>
  );
}
