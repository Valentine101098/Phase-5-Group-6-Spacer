import { useState, useEffect } from "react";

export default function SpaceReviewForm({ spaceId, onReviewSubmitted, onCancel, editingReview}) {

    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    
    useEffect(() => {
        if (editingReview) {
            setRating(editingReview.rating);
            setComment(editingReview.comment);
        }
    }, [editingReview]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const method = editingReview ? 'PATCH' : 'POST';
        const url = editingReview ? `/api/reviews/${editingReview.id}` : '/api/reviews';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_id: editingReview ? editingReview.booking_id : null,
                rating,
                comment,
            }),
        })
        .then(() => {
            setRating(5);
            setComment("");
            onReviewSubmitted();
            if (editingReview) onCancel()
        })
        .catch(err => console.error("Error submitting review:", err));
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
            <label className="font-semibold">Rating</label>
            <input 
                type="number" 
                min="1" 
                max="5" 
                value={rating} 
                onChange={(e) => setRating(Number(e.target.value))} 
                className="border p-2 rounded"
            />

            <label className="font-semibold">Comment</label>
            <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                className="border p-2 rounded"
            ></textarea>

            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
                {editingReview ? "Update Review" : "Submit Review"}
            </button>
            {editingReview && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition mt-2"
                >
                    Cancel
                </button>
            )}
        </form>
    )
}
