import { useState, useEffect } from "react";
import SpaceReviewForm from "./SpaceReviewForm";

export default function SpaceReview({ spaceId, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [editingReview, setEditingReview] = useState(null);
    
    const fetchReviews = () => {
        fetch(`/api/spaces/${spaceId}/reviews`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error("Error fetching reviews:", err));
    };

    useEffect(() => {
        fetchReviews();
    }, [spaceId]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-3/4 p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="text-gray-500 float-right">Close</button>
                <h2 className="text-2xl font-bold mb-4">Space Reviews</h2>

                {reviews.length === 0 ? (
                    <p>No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="border-b py-4">
                            <p>⭐ {review.rating}</p>
                            <p>{review.comment}</p>
                            {review.user_id === getCurrentUserId() && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setEditingReview(review)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            fetch(`/api/reviews/${review.id}`, { method: 'DELETE' })
                                                .then(() => fetchReviews())
                                                .catch(err => console.error("Error deleting review:", err));
                                        }}
                                        className="text-red-500 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                <SpaceReviewForm
                    spaceId={spaceId}
                    onSubmitted={fetchReviews}
                    editingReview={editingReview}
                    onCancel={() => setEditingReview(null)}
                />
            </div>
        </div>
    )
}