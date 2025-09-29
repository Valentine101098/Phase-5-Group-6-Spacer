import { useState, useEffect } from "react";
import SpaceCard from "./SpaceCard";

export default function Spaces() {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
                setSpaces(data);
            } catch (err) {
                console.error("Error fetching spaces:", err);
                setError("Failed to load spaces. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchSpaces();
    }, []);

    if (loading) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-lg font-semibold text-black">Loading spaces...</p>
                    </div>
                </div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {spaces.length === 0 ? (
                <p>No spaces available at the moment.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {spaces.map(space => (
                        <SpaceCard key={space.id} space={space} />
                    ))}
                </div>
            )}
        </div>
    );
}   