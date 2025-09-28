import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function SpaceReviewForm({ booking_id, onReviewSubmitted, onCancel, editingReview }) {

    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const { accessToken } = useAuth();

    useEffect(() => {
        if (editingReview) {
            setRating(editingReview.rating);
            setComment(editingReview.comment);
        }
    }, [editingReview]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const method = editingReview ? 'PATCH' : 'POST';
        const url = editingReview ? `http://127.0.0.1:5000/api/reviews/${editingReview.id}` : 'http://127.0.0.1:5000/api/reviews/';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                booking_id: editingReview ? editingReview.booking_id : booking_id,
                rating,
                comment,
            }),
        })
            .then(res => res.json())  
            .then(data => {
                setRating(5);
                setComment("");
                onReviewSubmitted(data); 
                if (editingReview) onCancel();
            })
            .catch(err => console.error("Error submitting review:", err));
    }

    return (
        <form onSubmit={handleSubmit} className="mt-2 bg-primary rounded flex p-4 flex-col m-4 gap-2">
            <label className="font-semibold text-white">Rating</label>
            <input
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="border p-2 rounded"
            />

            <label className="font-semibold text-white">Comment</label>
            <textarea
                value={comment}
                placeholder="Write your review here..."
                onChange={(e) => setComment(e.target.value)}
                className="border p-2 rounded mb-2"
            ></textarea>

            <span>
            <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 w-40 mx-auto rounded hover:bg-green-900 transition"
            >
                {editingReview ? "Update Review" : "Submit Review"}
            </button>
                
            {editingReview && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-500 text-white px-4 py-2 ml-4 rounded hover:bg-gray-600 transition mt-2"
                >
                    Cancel
                </button>
            )}
            </span>
        </form>
    )
}