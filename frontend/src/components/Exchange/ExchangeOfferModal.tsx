import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Book } from '../BookMarketplace';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ImageWithFallback } from '../ImageWithFallback';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { startChatWithUser } from '../../utils/chatUtils';
import { notifyExchangeParty } from '../../utils/chatNotifications';

interface ExchangeOfferModalProps {
    requestedBook: Book;
    onClose: () => void;
    isOpen: boolean;
}

export function ExchangeOfferModal({ requestedBook, onClose, isOpen }: ExchangeOfferModalProps) {
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentUser = auth.currentUser;
    const navigate = useNavigate();

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
            const [requestedSnap, offeredSnap] = await Promise.all([
                getDoc(doc(db, 'books', requestedBook.id)),
                getDoc(doc(db, 'books', selectedBookId)),
            ]);

            if (!requestedSnap.exists()) {
                toast.error('This listing is no longer available.');
                return;
            }
            if (!offeredSnap.exists()) {
                toast.error('The book you selected is no longer available.');
                return;
            }

            const requestedData = requestedSnap.data();
            const offeredData = offeredSnap.data();
            const ownerId = String(requestedData?.userId ?? '').trim();
            const offeredOwnerId = String(offeredData?.userId ?? '').trim();

            if (!ownerId) {
                toast.error('This listing is missing owner information.');
                return;
            }
            if (offeredOwnerId !== currentUser.uid) {
                toast.error('You can only offer books from your own listings.');
                return;
            }
            if (ownerId === currentUser.uid) {
                toast.error('You cannot propose an exchange on your own listing.');
                return;
            }

            const offeredTitle =
                (offeredData?.title as string) || (offeredData?.bookName as string) || 'Your book';
            const offeredImages = (offeredData?.images as string[] | undefined) || [];
            const reqTitle =
                (requestedData?.title as string) ||
                (requestedData?.bookName as string) ||
                requestedBook.title;
            const reqImages = (requestedData?.images as string[] | undefined) || requestedBook.images || [];
            const ownerName =
                (requestedData?.seller as { name?: string } | undefined)?.name ||
                requestedBook.seller?.name ||
                'Owner';
            const ownerAvatar =
                (requestedData?.seller as { avatar?: string } | undefined)?.avatar ||
                requestedBook.seller?.avatar ||
                '';

            const exchangeRef = await addDoc(collection(db, 'exchanges'), {
                requesterId: currentUser.uid,
                requesterName: currentUser.displayName || 'Someone',
                requesterAvatar: currentUser.photoURL || '',
                ownerId,
                ownerName,
                requestedBookId: requestedBook.id,
                requestedBookTitle: reqTitle,
                requestedBookImage: reqImages[0] || '',
                offeredBookId: selectedBookId,
                offeredBookTitle: offeredTitle,
                offeredBookImage: offeredImages[0] || '',
                status: 'pending',
                ownerAccepted: false,
                requesterAccepted: false,
                createdAt: serverTimestamp(),
            });
            const exchangeId = exchangeRef.id;

            notifyExchangeParty({
                recipientUserId: ownerId,
                title: 'New exchange offer',
                message: `${currentUser.displayName || 'Someone'} proposed a book swap for "${reqTitle}". Open Dashboard → Exchanges to accept or decline.`,
                exchangeId,
            });

            try {
                const chatId = await startChatWithUser(
                    navigate,
                    currentUser.uid,
                    ownerId,
                    { name: ownerName, avatar: ownerAvatar },
                    {
                        id: requestedBook.id,
                        title: reqTitle,
                        price: 0,
                        image: reqImages[0],
                        initialChatMessage: `I've sent you an exchange offer for "${reqTitle}". Please open Dashboard → Exchanges to accept or decline. We can coordinate the swap here in chat.`,
                    }
                );
                await updateDoc(doc(db, 'exchanges', exchangeId), { chatId });
            } catch (chatErr) {
                console.error('[ExchangeOfferModal] Chat setup failed:', chatErr);
                toast.warning(
                    'Offer sent, but starting the chat failed. Open Dashboard → Chats to message the seller.'
                );
            }

            toast.success('Exchange offer sent!');
            onClose();
        } catch (err: unknown) {
            console.error(err);
            const code =
                err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (code === 'permission-denied') {
                toast.error(
                    'Could not create this offer. Both books must exist, and you must own the book you are offering.'
                );
            } else {
                toast.error('Failed to send exchange offer');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch User Profile for real location comparison
    const [userSnapshot] = useDocument(currentUser ? doc(db, 'users', currentUser.uid) : null);
    const userLocation = userSnapshot?.data()?.location?.city || userSnapshot?.data()?.location?.zip;
    const bookLocation = requestedBook.location?.city || requestedBook.location?.zipCode;

    // Location check logic
    const isLocationWarning = !!(userLocation && bookLocation && userLocation.toLowerCase() !== bookLocation.toLowerCase());

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
                                    <ImageWithFallback
                                        src={book.images?.[0]}
                                        alt={book.title || 'Book'}
                                        className="w-16 h-24 object-cover rounded shrink-0"
                                    />
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
