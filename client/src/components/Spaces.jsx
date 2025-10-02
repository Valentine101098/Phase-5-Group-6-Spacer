import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import SpaceCard from "./SpaceCard";
import { API_BASE_URL } from "../config/api";

export default function Spaces({ searchResults, isSearching, onClearSearch }) {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage] = useState(12);

    useEffect(() => {
        // Only fetch all spaces if we're not searching
        if (!isSearching) {
            const fetchSpaces = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const response = await fetch(
                        `${API_BASE_URL}/api/spaces?page=${currentPage}&per_page=${perPage}`
                    );
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
                        setTotalPages(data.total_pages || 1);
                        setTotalCount(data.total || spacesData.length);
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
    }, [isSearching, currentPage, perPage]);

    // Determine which spaces to display
    const displaySpaces = isSearching ? (searchResults || []) : spaces;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderPagination = () => {
        if (isSearching || totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex justify-center items-center gap-2 mt-8 mb-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${
                        currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200'
                    }`}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                        >
                            1
                        </button>
                        {startPage > 2 && (
                            <span className="px-2 text-gray-500">...</span>
                        )}
                    </>
                )}

                {pageNumbers.map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg ${
                            currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${
                        currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200'
                    }`}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        );
    };

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
            {!isSearching && totalCount > 0 && (
                <div className="mb-4 text-center text-gray-600">
                    Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalCount)} of {totalCount} spaces
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displaySpaces.map(space => (
                    <SpaceCard key={space.id} space={space} />
                ))}
            </div>

            {renderPagination()}
        </div>
    );
}