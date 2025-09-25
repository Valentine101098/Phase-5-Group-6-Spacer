import { useState, useEffect } from "react";   

export default function SpaceDetails({ space, onClose }) {
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/reviews/spaces/${space.id}?limit=5`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error("Error fetching reviews:", err));
    }, [space.id]);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-white rounded-2xl shadow-lg w-1/2 p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className=" text-red-500 float-right">Close</button>
                <h2 className="text-2xl font-bold mb-4">{space.title}</h2>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {space.images.slice(0, 4).map((imgUrl, index) => (
                        <img
                            key={index}
                            src={imgUrl}
                            alt={`Space Image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                        />
                    ))}
                </div>

                <p className="mb-3">{space.description}</p>
                <p><strong>Space Type:</strong> {space.space_type}</p>
                <p><strong>Maximum Guests:</strong> {space.max_guests}</p>
                <p><strong>Price:</strong> Kshs {space.price_per_hour}/hr</p>
                <p><strong>Status:</strong> {space.status}</p>

                {space.template?.terms && (
                    <div className="mt-4 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">Agreement Terms</h3>
                        <div className="bg-blue-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                            {space.template.terms}
                        </div>
                    </div>
                )}
                {reviews.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">Recent Reviews</h3>
                        {reviews.map(review => (
                            <div key={review.id} className="border-b py-2">
                                <p>{review.user.first_name} : {review.rating}⭐</p>
                                <p>{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
                {space.status === 'available' &&
                    <button className="bg-blue-500 text-white px-4 py-2 mt-3 w-40 rounded-lg hover:bg-blue-600">
                        Book
                    </button>
                }
            </div>
        </div>
    )
}