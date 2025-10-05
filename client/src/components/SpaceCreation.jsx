import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function SpaceCreation({ existingSpace, onSpaceCreated, onSpaceUpdated }) {
    const { makeAuthenticatedRequest } = useAuth();

    const [form, setForm] = useState({
        title: "",
        description: "",
        price_per_hour: "",
        space_type: "",
        max_guests: "",
        images: [""],
        terms: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Pre-fill form if editing
    useEffect(() => {
        if (existingSpace) {
            setForm({
                title: existingSpace.title || "",
                description: existingSpace.description || "",
                price_per_hour: existingSpace.price_per_hour || "",
                space_type: existingSpace.space_type || "",
                max_guests: existingSpace.max_guests || "",
                images: existingSpace.images?.length ? existingSpace.images : [""],
                terms: existingSpace.terms || "",
            });
        }
    }, [existingSpace]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (index, value) => {
        setForm((prev) => {
            const updatedImages = [...prev.images];
            updatedImages[index] = value;
            return {
                ...prev,
                images: updatedImages,
            };
        });
    };

    const addImageField = () => {
        setForm((prev) => ({
            ...prev,
            images: [...prev.images, ""],
        }));
    };

    const removeImageField = (index) => {
        if (form.images.length > 1) {
            setForm((prev) => {
                const updatedImages = prev.images.filter((_, i) => i !== index);
                return {
                    ...prev,
                    images: updatedImages,
                };
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);


        // Convert numeric fields
        const formData = {
            ...form,
            price_per_hour: parseFloat(form.price_per_hour) || 0,
            max_guests: parseInt(form.max_guests) || 1,
            images: form.images.filter((img) => img.trim() !== ""), // Remove empty URLs
        };


        try {
            let result;

            if (existingSpace) {
                // PATCH (edit)
                result = await makeAuthenticatedRequest(
                    `/api/spaces/${existingSpace.id}`,
                    "PATCH",
                    formData
                );

                if (result.success) {
                    onSpaceUpdated?.(result.data);
                    alert("Space updated successfully!");
                } else {
                    throw new Error(result.error || "Failed to update space");
                }
            } else {
                // POST (create)
                result = await makeAuthenticatedRequest("/api/spaces/", "POST", formData);

                if (result.success) {
                    onSpaceCreated?.(result.data);
                    alert("Space created successfully!");

                    // Reset form after successful creation
                    setForm({
                        title: "",
                        description: "",
                        price_per_hour: "",
                        space_type: "",
                        max_guests: "",
                        images: [""],
                        terms: "",
                    });
                } else {
                    throw new Error(result.error || "Failed to create space");
                }
            }

        } catch (err) {
            console.error("Error submitting space:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-4 bg-gradient-to-br from-blue-700 via-purple-700 to-blue-400 shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">
                {existingSpace ? "Edit Space" : "Create New Space"}
            </h2>

            {error && (
                <div className="text-red-500 mb-4 bg-red-50 p-3 rounded border border-red-200 text-sm"> {/* Adjusted text size */}
                    <p className="font-medium">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4"> {/* Added space-y for consistent spacing */}
                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Title</label> {/* Adjusted text size and color */}
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        placeholder="Space Title"
                        onChange={handleChange}
                        className="w-full border p-2 rounded-md mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" // Adjusted padding and text size
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        placeholder="Space Description"
                        onChange={handleChange}
                        rows="4"
                        className="w-full border p-2 rounded-md mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Price per Hour (Kshs)</label>
                    <input
                        type="number"
                        name="price_per_hour"
                        value={form.price_per_hour}
                        placeholder="Price per Hour"
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full border p-2 rounded-md mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Space Type</label>
                    <input
                        type="text"
                        name="space_type"
                        value={form.space_type}
                        placeholder="e.g., Conference Room, Private Office"
                        onChange={handleChange}
                        className="w-full border p-2 rounded-md mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Maximum Guests</label>
                    <input
                        type="number"
                        name="max_guests"
                        value={form.max_guests}
                        placeholder="Maximum Guests"
                        onChange={handleChange}
                        min="1"
                        className="w-full border p-2 rounded-md mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Agreement Terms</label>
                    <textarea
                        name="terms"
                        value={form.terms}
                        placeholder="Agreement Terms and Conditions"
                        onChange={handleChange}
                        rows="3"
                        className="w-full border p-2 rounded-md mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Images (URLs)</label>
                    {form.images.map((img, index) => (
                        <div key={`image-${index}`} className="flex flex-col sm:flex-row gap-2 mb-2"> {/* Responsive layout for image fields */}
                            <input
                                type="url"
                                value={img}
                                placeholder={`Image URL ${index + 1}`}
                                onChange={(e) => handleImageChange(index, e.target.value)}
                                className="flex-1 border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {form.images.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeImageField(index)}
                                    className="px-3 py-1 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addImageField}
                    className="mb-4 text-white hover:text-green-400 hover:underline font-medium text-sm"
                >
                    + Add Another Image
                </button>

                <button
                    type="submit" // Changed to submit type
                    disabled={loading}
                    className={`w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-700 transition text-sm sm:text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading
                        ? existingSpace
                            ? "Updating Space..."
                            : "Creating Space..."
                        : existingSpace
                            ? "Update Space"
                            : "Create Space"}
                </button>
            </form>
        </div>
    );
}
