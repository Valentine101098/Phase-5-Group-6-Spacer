import { useState } from "react";   
import { useAuth } from "../contexts/AuthContext";

export default function SpaceCreation({ onSpaceCreated }) {
    const { accessToken } = useAuth();
    const [form, setForm] = useState({
        title: "",
        description: "",
        price_per_hour: 0,
        space_type: "",
        max_guests: 0,
        images: [""],
        terms: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    const handleImageChange = (index, value) => {
        const updatedImages = [...form.images];
        updatedImages[index] = value;
        setForm({
            ...form,
            images: updatedImages,
        });
    }

    const addImageField = () => {
        setForm({
            ...form,
            images: [...form.images, ""],
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch("http://127.0.0.1:5000/api/spaces/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || "Failed to create space");
            }

            const newSpace = await response.json();
            onSpaceCreated(newSpace);
            setForm({
                title: "",
                description: "",
                price_per_hour: Number(""),
                space_type: "",
                max_guests: "",
                images: [""],
                terms: "",
            });
        } catch (err) {
            console.error("Error creating space:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white dark:bg-primary shadow-lg rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-white">Create New Space</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <label className="block mb-2 font-semibold text-white">Title</label>
            <input 
                type="text"
                name="title"
                value={form.title}
                placeholder="Space Title"
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
            />

            <label className="block mb-2 font-semibold text-white">Description</label>
            <textarea 
                name="description"
                value={form.description}
                placeholder="Space Description"
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
            />

            <label className="block mb-2 font-semibold text-white">Price per Hour (Kshs)</label>
            <input 
                type="number"
                name="price_per_hour"
                value={form.price_per_hour}
                placeholder="Price per Hour"
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
            />
            
            <label className="block mb-2 font-semibold text-white">Space Type</label>
            <input 
                type="text"
                name="space_type"
                value={form.space_type}
                placeholder="e.g., Conference Room, Private Office"
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
            />

            <label className="block mb-2 font-semibold text-white">Maximum Guests</label>
            <input 
                type="number"
                name="max_guests"
                value={form.max_guests}
                placeholder="Maximum Guests"
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
            />

            <label className="block mb-2 font-semibold text-white">Agreement Terms</label>
            <textarea 
                name="terms"
                value={form.terms}
                placeholder="Agreement Terms"
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
            />

            <label className="block mb-2 font-semibold text-white">Images (URLs)</label>
            {form.images.map((img, index) => (
                <input
                    key={index}
                    type="text"
                    value={img}
                    placeholder={`Image URL ${index + 1}`}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="w-full border p-2 rounded mb-2"
                    required
                />
            ))}
            

            <button
                type="button"
                onClick={addImageField}
                className="mb-4 text-white hover:underline text-green"
            >
                + Add Image
            </button>   
            <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-900 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? "Saving..." : "Create Space"}
            </button>
        </form>
    )
}