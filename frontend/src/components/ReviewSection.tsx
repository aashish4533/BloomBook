import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';

interface ReviewSectionProps {
    tutorId: string;
    reviews: any[]; // In a real app, this would be passed or fetched
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ tutorId, reviews: initialReviews }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result: any = await apiClient.addReview({ tutorId, rating, text });
            // Optimistically add review
            const newReview = { rating, text, sentimentScore: result.sentimentScore, createdAt: new Date().toISOString() };
            setReviews([newReview, ...reviews]);
            setText('');
            setRating(5);
        } catch (err: any) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-2xl font-bold mb-6">Reviews & Ratings</h3>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded bg-gray-50">
                <h4 className="font-semibold mb-3">Write a Review</h4>
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="p-2 border rounded w-full md:w-1/4"
                    >
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Review</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full p-2 border rounded h-24"
                        placeholder="Share your experience..."
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>

            {/* Review List */}
            <div className="space-y-4">
                {reviews.length === 0 ? <p className="text-gray-500">No reviews yet.</p> : reviews.map((review, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                                <span className="font-bold mr-2 text-yellow-500">{'★'.repeat(review.rating)}</span>
                                <span className="text-gray-400 text-sm">{new Date(review.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            {review.sentimentScore !== undefined && (
                                <span className={`text-xs px-2 py-1 rounded ${review.sentimentScore > 0 ? 'bg-green-100 text-green-800' :
                                        review.sentimentScore < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                                    }`}>
                                    {review.sentimentScore > 0 ? 'Positive' : review.sentimentScore < 0 ? 'Negative' : 'Neutral'}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-700">{review.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
