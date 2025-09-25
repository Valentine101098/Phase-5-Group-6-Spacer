import { useState } from "react";
import SpaceDetails from "./SpaceDetails";
import { Star } from "lucide-react";

export default function SpaceCard({ space }) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="border w-full h-full rounded-lg overflow-hidden shadow-lg hover:shadow-[0_10px_20px_rgba(0,0,0,0.8)] hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <div className="relative w-full h-60 overflow-hidden"> {/* Fixed height for the image container */}
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
                <div className="absolute bottom-3 right-3 text-white text-xs px-3 py-1 rounded-full font-medium">
                    <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${space.status === 'available' ? 'bg-green-300 text-green-800' : 'bg-red-300 text-red-800'
                            }`}>
                        {space.status}
                    </span>
                </div>
                <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    <Star className="inline h-3 w-3 mr-1" />
                    Featured
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2">{space.title}</h3>
                <p className="text-gray-600 mb-4 flex-grow">{space.description}</p>
                <p className="text-sm text-black mb-2"><strong>Type:</strong> {space.space_type}</p>
                <div className="flex justify-between items-center mt-2">
                    
                    
                </div>
                <span className="font-bold mt-2 text-indigo-600">
                    Kshs {space.price_per_hour}/hr
                </span>
                <div className="mt-3 flex flex-col gap-2">
                    <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300" onClick={() => setShowDetails(true)}>
                        More Details
                    </button>
                    {space.status === "available" ?
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                        Book
                    </button> : null}
                </div>
            </div>
            {showDetails && (<SpaceDetails space={space} onClose={() => setShowDetails(false)} />)}
        </div>
    )
}