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
                    className={`p-2 rounded-lg backdrop-blur-sm ${
                        currentPage === 1
                            ? 'bg-gray-100/80 text-gray-400 cursor-not-allowed'
                            : 'bg-white/90 text-blue-600 hover:bg-blue-50/90 border border-gray-200/50 shadow-md'
                    }`}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-blue-50/90 border border-gray-200/50 shadow-md"
                        >
                            1
                        </button>
                        {startPage > 2 && (
                            <span className="px-2 text-white drop-shadow-lg font-semibold">...</span>
                        )}
                    </>
                )}

                {pageNumbers.map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg backdrop-blur-sm shadow-md ${
                            currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'bg-white/90 text-gray-700 hover:bg-blue-50/90 border border-gray-200/50'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && (
                            <span className="px-2 text-white drop-shadow-lg font-semibold">...</span>
                        )}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-blue-50/90 border border-gray-200/50 shadow-md"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg backdrop-blur-sm ${
                        currentPage === totalPages
                            ? 'bg-gray-100/80 text-gray-400 cursor-not-allowed'
                            : 'bg-white/90 text-blue-600 hover:bg-blue-50/90 border border-gray-200/50 shadow-md'
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
            <div className="flex justify-center items-center h-64 bg-white/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="ml-4 text-white font-semibold drop-shadow-lg">Loading amazing spaces...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center bg-red-50/95 backdrop-blur-md border border-red-200 rounded-lg p-8 shadow-xl">
                <div className="text-red-600 mb-4">
                    <Search className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <p className="text-red-700 font-medium">{error}</p>
            </div>
        );
    }

    if (displaySpaces.length === 0) {
        return (
            <div className="text-center bg-white/95 backdrop-blur-md border border-white/50 rounded-lg p-8 shadow-xl">
                <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-700 font-medium">
                    {isSearching ? 'No spaces match your search criteria' : 'No spaces currently available'}
                </p>
                {isSearching && onClearSearch && (
                    <button
                        onClick={onClearSearch}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
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
                <div className="mb-4 text-center">
                    <span className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full text-gray-700 font-semibold shadow-lg border border-white/50">
                        Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalCount)} of {totalCount} spaces
                    </span>
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