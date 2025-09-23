import { useState } from "react";
import SpaceReview from "./SpaceReview";
import SpaceDetails from "./SpaceDetails";

export default function SpaceCard({ space }) {
    const [showDetails, setShowDetails] = useState(false);
    const [showReviews, setShowReviews] = useState(false);

    return (
        <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative w-full h-48 overflow-hidden"> {/* Fixed height for the image container */}
                <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory">
                    {space.images.map((imgUrl, index) => (
                        <img
                            key={index}
                            src={imgUrl}
                            alt={`Space Image ${index + 1}`}
                            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${index === 0 ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2">{space.title}</h3>
                <p className="text-gray-600 mb-4 flex-grow">{space.description}</p>
                <p className="text-sm text-gray-500 mb-2">Type: {space.space_type}</p>
                <p className="text-sm text-gray-500 mb-4">Price: Kshs {space.price_per_hour}/hr</p>
                <div className="flex justify-between items-center mt-2">
                    <span 
                        className={`px-2 py-1 text-xs font-semibold rounded ${space.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {space.status}
                    </span>
                    <span className="font-bold text-indigo-600">
                        Kshs {space.price_per_hour}/hr
                    </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                    <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300" onClick={() => setShowDetails(true)}>
                        More Details
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                        Book
                    </button>
                    <button
                        onClick={() => setShowReviews((prev) => !prev)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                    >
                        Reviews ⭐
                    </button>
                </div>
            </div>
            {showDetails && (<SpaceDetails space={space} onClose={() => setShowDetails(false)} />)}
            {showReviews && (<SpaceReview spaceId={space.id} onClose={() => setShowReviews(false)} />)}
        </div>
    )
}