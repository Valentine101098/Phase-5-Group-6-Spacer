import { useState, useEffect } from "react";
import SpaceReviewForm from "./SpaceReviewForm";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { Star, X } from "lucide-react"; // Import X for close icon

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
        fetch(`${API_BASE_URL}/api/reviews/spaces/${space.id}?limit=5`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error("Error fetching reviews:", err));
    };

    const fetchUserBookings = () => {
        if (user && accessToken) { // Ensure accessToken is available
            fetch(`${API_BASE_URL}/api/bookings/`, {
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
    }, [space.id, user, accessToken]); // Added accessToken to dependencies

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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"> {/* Added padding for mobile */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg md:max-w-2xl lg:max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col"> {/* Responsive width and padding */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"> {/* Responsive text size */}
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
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"> {/* Adjusted close button color */}
                        <X className="h-6 w-6" /> {/* Using Lucide X icon */}
                    </button>
                </div>

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


                <p className="mb-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">{space.description}</p> {/* Responsive text size and color */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 shadow p-4 rounded-xl bg-white dark:bg-gray-700"> {/* Responsive grid and spacing */}
                    <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"> {/* Responsive padding and dark mode support */}
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Space Type</div> {/* Responsive text size */}
                        <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">{space?.space_type}</div> {/* Responsive text size and dark mode support */}
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max Guests</div>
                        <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{space?.max_guests}</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Kshs Per Hour</div>
                        <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                            {parseFloat(space?.price_per_hour || 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <div className="mt-4 border-t pt-4 flex-1 border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Recent Reviews</h3> {/* Responsive text size and dark mode */}
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="border-b py-2 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200"> {/* Dark mode support */}
                                <p className="text-sm sm:text-base"> {/* Responsive text size */}
                                    {review.user.first_name} : {review.rating} <Star className="inline h-4 w-4 text-yellow-400 fill-current" />
                                </p>
                                <p className="text-sm sm:text-base">{review.comment}</p> {/* Responsive text size */}
                                {user && review.user_id === user.id && (
                                    <div className="flex gap-2 mt-1 text-sm"> {/* Responsive text size */}
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
                                                fetch(`${API_BASE_URL}/api/reviews/${review.id}`, {
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
                        <p className="text-gray-500 italic text-sm sm:text-base">No Reviews yet.</p>)
}
                </div>

                {/* Review Form */}
                {showReviewForm && hasBooked && (
                    <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">
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
                        className="bg-yellow-400 text-yellow-900 px-4 py-2 mt-3 w-full sm:w-40 mx-auto rounded-lg hover:bg-yellow-600 hover:text-yellow-900 transition text-sm sm:text-base" // Responsive width
                    >
                        Add Review
                    </button>
                )}

                {/* Book button pinned at bottom */}
                <div className="mt-6 flex justify-center sm:justify-end"> {/* Responsive alignment */}
                    {space.status === "available" && (
                        <Link to={`/spaces/${space.id}/booking`}>
                        <button className="bg-blue-600 text-white px-5 py-2 w-full sm:w-40 rounded-lg hover:bg-blue-700 text-sm sm:text-base"> {/* Responsive width */}
                            Book Now
                        </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}