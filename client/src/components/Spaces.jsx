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
                const response = await fetch("http://localhost:5000/api/spaces");
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
        return <div>Loading spaces...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Available Spaces</h2>
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