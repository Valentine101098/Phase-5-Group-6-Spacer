import { useState, useEffect } from "react";
import SpaceReviewForm from "./SpaceReviewForm";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SpaceDetails({ space, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [userBookings, setUserBookings] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { user, accessToken } = useAuth();

    const totalImages = space.images.length;

    const goPrev = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? totalImages - 1 : prevIndex - 1));
    };
    
    const goNext = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === totalImages - 1 ? 0 : prevIndex + 1));
    };  

    const fetchReviews = () => {
        fetch(`http://127.0.0.1:5000/api/reviews/spaces/${space.id}?limit=5`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error("Error fetching reviews:", err));
    };

    const fetchUserBookings = () => {
        if (user) {
            fetch(`http://127.0.0.1:5000/api/bookings/`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(res => res.json())
                .then(data => {
                    const spaceBookings = data.data.filter(
                        ({ space_id, user_id }) => space_id === space.id && user_id === user.id
                    );
                    setUserBookings(spaceBookings);
                })
                .catch(err => console.error("Error fetching user bookings:", err));
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchUserBookings();
    }, [space.id, user]);

    const hasBooked = userBookings.length > 0;
    const latestBooking = userBookings[0];

    // find if this user already has a review
    const userReview = reviews.find(r => r.user_id === user?.id);

    // Handle review submit (new or edited)
    const handleReviewSubmitted = (newReview) => {
        if (editingReview) {
            // replace edited review
            setReviews(reviews.map(r => (r.id === editingReview.id ? { ...r, ...newReview, id: editingReview.id } : r)));
            setEditingReview(null);
        } else {
            // prepend new review
            setReviews([newReview, ...reviews]);
        }
        setShowReviewForm(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-white rounded-2xl shadow-lg w-1/2 p-6 max-h-[90vh] overflow-y-auto flex flex-col">
                <button onClick={onClose} className="text-red-500 self-end">Close</button>
                <h2 className="text-2xl font-bold mb-4">
                    {space.title}{" "}
                    <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${space.status === "available"
                                ? "bg-green-300 text-green-900"
                                : "bg-red-300 text-red-900"
                            }`}
                    >
                        {space.status}
                    </span>
                </h2>

                {/* Gallery Section */}
                <div className="flex justify-center shadow rounded p-4 mb-4">
                    <div className="grid gap-4 max-w-4xl w-full">
                        {/* Featured Image with arrows + counter */}
                        {space.images[currentImageIndex] && (
                            <div className="relative flex justify-center">
                                <button
                                    onClick={goPrev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <img
                                    src={space.images[currentImageIndex]}
                                    alt={`Featured Space ${currentImageIndex + 1}`}
                                    className="h-auto max-w-full rounded-lg object-cover shadow-lg"
                                />

                                <button
                                    onClick={goNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                                    {currentImageIndex + 1} / {totalImages}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-5 gap-4 justify-center">
                            {space.images.slice(0, 6).map((imgUrl, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`focus:outline-none ${index === currentImageIndex ? "ring-2 ring-green-500 rounded-lg" : ""
                                        }`}
                                >
                                    <img
                                        src={imgUrl}
                                        alt={`Space Thumbnail ${index + 1}`}
                                        className="h-auto max-w-full rounded-lg object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                <p className="mb-3">{space.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shadow p-4 rounded-xl bg-white">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-sm text-gray-600">Space Type</div>
                        <div className="text-lg font-bold text-green-600">{space?.space_type}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-sm text-gray-600">Max Guests</div>
                        <div className="text-lg font-bold text-blue-600">{space?.max_guests}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                        <div className="text-sm text-gray-600">Kshs Per Hour</div>
                        <div className="text-lg font-bold text-purple-600">
                            {parseFloat(space?.price_per_hour || 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <div className="mt-4 border-t pt-4 flex-1">
                    <h3 className="text-xl font-semibold mb-2">Recent Reviews</h3>
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="border-b py-2">
                                <p>
                                    {review.user.first_name} : {review.rating}⭐
                                </p>
                                <p>{review.comment}</p>
                                {user && review.user_id === user.id && (
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            onClick={() => {
                                                setEditingReview(review);
                                                setShowReviewForm(true);
                                            }}
                                            className="text-blue-500 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                fetch(`http://127.0.0.1:5000/api/reviews/${review.id}`, {
                                                    method: "DELETE",
                                                    headers: {
                                                        Authorization: `Bearer ${accessToken}`,
                                                    },
                                                })
                                                    .then(() =>
                                                        setReviews(reviews.filter((r) => r.id !== review.id))
                                                    )
                                                    .catch((err) =>
                                                        console.error("Error deleting review:", err)
                                                    );
                                            }}
                                            className="text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No Reviews yet.</p>
                    )}
                </div>

                {/* Review Form */}
                {showReviewForm && hasBooked && (
                    <div className="mt-4 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">
                            {editingReview ? "Edit Your Review" : "Add Your Review"}
                        </h3>
                        <SpaceReviewForm
                            spaceId={space.id}
                            booking_id={latestBooking?.id}
                            editingReview={editingReview}
                            onReviewSubmitted={handleReviewSubmitted}
                            onCancel={() => {
                                setShowReviewForm(false);
                                setEditingReview(null);
                            }}
                        />
                    </div>
                )}

                {/* Add Review button */}
                {hasBooked && !showReviewForm && !userReview && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-yellow-400 text-yellow-900 px-4 py-2  mt-3 w-40 mx-auto rounded-lg hover:bg-yellow-600 hover:text-yellow-900 transition"
                    >
                        Add Review
                    </button>
                )}

                {/* Book button pinned at bottom */}
                <div className="mt-6 flex justify-end">
                    {space.status === "available" && (
                        <Link to={`/spaces/${space.id}/booking`}>
                        <button className="bg-blue-500 text-white px-4 py-2 w-40 rounded-lg hover:bg-blue-600">
                            Book Now
                        </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
