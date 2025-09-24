export default function SpaceDetails({ space, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-blue-700 rounded-2xl shadow-lg w-1\2 p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="text-white float-right">Close</button>
                <h2 className="text-2xl text-white font-bold mb-4">{space.title}</h2>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {space.images.slice(0, 4).map((imgUrl, index) => (
                        <img
                            key={index}
                            src={imgUrl}
                            alt={`Space Image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                        />
                    ))}
                </div>

                <p className="mb-3 text-white">{space.description}</p>
                <p className="text-white"><strong>Space Type:</strong> {space.space_type}</p>"
                <p className="text-white"><strong>Maximum Guests:</strong> {space.max_guests}</p>
                <p className="text-white"><strong>Price:</strong> Kshs {space.price_per_hour}/hr</p>
                <p className="text-white mb-2"><strong>Status:</strong> {space.status}</p>

                {space.template?.terms && (
                    <div className="mt-4 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">Agreement Terms</h3>
                        <div className="bg-blue-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                            {space.template.terms}
                        </div>
                    </div>
                )}
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Book
                </button>
                <button
                    onClick={() => setShowReviews((prev) => !prev)}
                    className="bg-yellow-500 text-white px-4 py-2 ml-2 rounded-lg hover:bg-yellow-600"
                >
                    Reviews ⭐
                </button>
            </div>
        </div>
    )
}