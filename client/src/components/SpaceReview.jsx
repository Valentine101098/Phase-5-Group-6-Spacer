import { useState, useEffect } from "react";
import SpaceReviewForm from "./SpaceReviewForm";
import { useAuth } from "../contexts/AuthContext";

export default function SpaceReview({ spaceId, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [editingReview, setEditingReview] = useState(null);
    const { user } = useAuth();
    
    const fetchReviews = () => {
        fetch(`http://127.0.0.1:5000/reviews/spaces/${spaceId}?limit=5`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error("Error fetching reviews:", err));
    };

    useEffect(() => {
        fetchReviews();
    }, [spaceId]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-blue-600 rounded-2xl shadow-lg w-1/2 p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="text-white float-right">Close</button>
                <h2 className="text-2xl text-white font-bold mb-4">Space Reviews</h2>

                {reviews.length === 0 ? (
                    <p className="text-white">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="border-b py-4">
                            <p>⭐ {review.rating}</p>
                            <p>{review.comment}</p>
                            {user && review.user_id === user?.id && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setEditingReview(review)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            fetch(`/reviews/${review.id}`, { method: 'DELETE' })
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