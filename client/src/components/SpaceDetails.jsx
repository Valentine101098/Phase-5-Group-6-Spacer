export default function SpaceDetails({ space, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-3/4 p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="text-gray-500 float-right">Close</button>
                <h2 className="text-2xl font-bold mb-4">{space.title}</h2>

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

                <p className="mb-3">{space.description}</p>
                <p><strong>Space Type:</strong> {space.space_type}</p>"
                <p><strong>Maximum Guests:</strong> {space.max_guests}</p>
                <p><strong>Price:</strong> Kshs {space.price_per_hour}/hr</p>
                <p><strong>Status:</strong> {space.status}</p>

                {space.template?.terms && (
                    <div className="mt-4 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">Agreement Terms</h3>
                        <div className="bg-blue-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                            {space.template.terms}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}