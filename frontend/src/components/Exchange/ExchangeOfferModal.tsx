import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../firebase';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Book } from '../BookMarketplace';
import { Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface ExchangeOfferModalProps {
    requestedBook: Book;
    onClose: () => void;
    isOpen: boolean;
}

export function ExchangeOfferModal({ requestedBook, onClose, isOpen }: ExchangeOfferModalProps) {
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentUser = auth.currentUser;

    // Fetch user's available books
    const [userBooksSnapshot, loading, error] = useCollection(
        currentUser
            ? query(
                collection(db, 'books'),
                where('userId', '==', currentUser.uid),
                // where('status', '==', 'active') // Assuming active status for available books
                // Need to ensure status field exists and is populated, basing on previous Turn it is 'active' or 'available'
            )
            : null
    );

    const userBooks = userBooksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)) || [];

    const handleExchange = async () => {
        if (!currentUser || !selectedBookId) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'exchanges'), {
                requesterId: currentUser.uid,
                requesterName: currentUser.displayName,
                requesterAvatar: currentUser.photoURL,
                ownerId: requestedBook.userId,
                ownerName: requestedBook.seller.name,
                requestedBookId: requestedBook.id,
                requestedBookTitle: requestedBook.title,
                requestedBookImage: requestedBook.images[0],
                offeredBookId: selectedBookId,
                offeredBookTitle: userBooks.find(b => b.id === selectedBookId)?.title,
                offeredBookImage: userBooks.find(b => b.id === selectedBookId)?.images[0],
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast.success('Exchange offer sent!');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to send exchange offer');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Location check logic (mock for now as we might need zip codes from user profile or book data)
    // Assuming simple check if specific location strings match or warning
    const isLocationWarning = false; // TODO: Implement real comparison

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Propose an Exchange</DialogTitle>
                    <DialogDescription>
                        Select one of your books to offer for <strong>{requestedBook.title}</strong>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C4A672]" />
                    </div>
                ) : error ? (
                    <p className="text-red-500">Error loading your books.</p>
                ) : userBooks.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-gray-500 mb-4">You don't have any listed books to exchange.</p>
                        <Button onClick={onClose} variant="outline">Close</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Location Warning Mock */}
                        {isLocationWarning && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-2 text-yellow-800 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>The owner is in a different location. Shipping may be required.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            {userBooks.map(book => (
                                <div
                                    key={book.id}
                                    onClick={() => setSelectedBookId(book.id)}
                                    className={`
                    border rounded-lg p-3 cursor-pointer transition-all flex gap-3
                    ${selectedBookId === book.id
                                            ? 'border-[#C4A672] bg-[#C4A672]/5 ring-1 ring-[#C4A672]'
                                            : 'border-gray-200 hover:border-[#C4A672]/50'
                                        }
                  `}
                                >
                                    <img src={book.images[0]} alt={book.title} className="w-16 h-24 object-cover rounded" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-[#2C3E50] truncate">{book.title}</h4>
                                        <p className="text-xs text-gray-500 truncate">{book.author}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={handleExchange}
                                disabled={!selectedBookId || isSubmitting}
                                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                            >
                                {isSubmitting ? 'Sending Offer...' : 'Send Offer'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
