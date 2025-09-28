import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import SpaceCard from "./SpaceCard";

export default function Spaces({ searchResults, isSearching, onClearSearch }) {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Only fetch all spaces if we're not searching
        if (!isSearching) {
            const fetchSpaces = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const response = await fetch("http://127.0.0.1:5000/api/spaces");
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, Body: ${errorText}`);
                    }
                    const data = await response.json();

                    // Handle different response structures
                    const spacesData = data.spaces || data;

                    // Ensure we have an array
                    if (Array.isArray(spacesData)) {
                        setSpaces(spacesData);
                    } else {
                        console.error("API returned unexpected data structure:", data);
                        setSpaces([]);
                    }
                } catch (err) {
                    console.error("Error fetching spaces:", err);
                    setError("Failed to load spaces. Please try again later.");
                    setSpaces([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchSpaces();
        } else {
            // When searching, don't show loading state
            setLoading(false);
        }
    }, [isSearching]);

    // Determine which spaces to display
    const displaySpaces = isSearching ? (searchResults || []) : spaces;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading amazing spaces...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8">
                <div className="text-red-600 mb-4">
                    <Search className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <p className="text-red-700 font-medium">{error}</p>
            </div>
        );
    }

    if (displaySpaces.length === 0) {
        return (
            <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-8">
                <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">
                    {isSearching ? 'No spaces match your search criteria' : 'No spaces currently available'}
                </p>
                {isSearching && onClearSearch && (
                    <button
                        onClick={onClearSearch}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        View All Spaces
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displaySpaces.map(space => (
                    <SpaceCard key={space.id} space={space} />
                ))}
            </div>
        </div>
    );
}