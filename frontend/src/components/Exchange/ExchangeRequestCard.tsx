import { useState } from 'react';
import { Button } from '../ui/button';
import { MessageCircle, Check, X, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { notifyExchangeParty } from '../../utils/chatNotifications';

interface ExchangeRequest {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterAvatar: string;
    ownerId: string;
    ownerName: string;
    requestedBookId: string;
    requestedBookTitle: string;
    requestedBookImage: string;
    offeredBookId: string;
    offeredBookTitle: string;
    offeredBookImage: string;
    status: 'pending' | 'chatting' | 'accepted' | 'rejected' | 'completed' | 'both_accepted';
    createdAt: any;
    rejectionReason?: string;
    chatId?: string;
    ownerAccepted?: boolean;
    requesterAccepted?: boolean;
}

interface ExchangeRequestCardProps {
    request: ExchangeRequest;
    isIncoming: boolean;
}

async function finalizeDualAccept(exchangeId: string, request: ExchangeRequest) {
    const exRef = doc(db, 'exchanges', exchangeId);
    await updateDoc(exRef, {
        status: 'both_accepted',
        updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'books', request.requestedBookId), {
        listingStatus: 'reserved',
        exchangeReservationId: exchangeId,
    });
    await updateDoc(doc(db, 'books', request.offeredBookId), {
        listingStatus: 'reserved',
        exchangeReservationId: exchangeId,
    });
    const msg =
        'You both confirmed this swap. The listings are held — coordinate pickup in chat. See Reservations for this exchange.';
    notifyExchangeParty({
        recipientUserId: request.ownerId,
        title: 'Exchange confirmed',
        message: msg,
        exchangeId,
    });
    notifyExchangeParty({
        recipientUserId: request.requesterId,
        title: 'Exchange confirmed',
        message: msg,
        exchangeId,
    });
}

export function ExchangeRequestCard({ request, isIncoming }: ExchangeRequestCardProps) {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const uid = auth.currentUser?.uid;

    const chatId = request.chatId || [request.requesterId, request.ownerId].sort().join('_');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>;
            case 'chatting':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Chatting</span>;
            case 'accepted':
                return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Accepted</span>;
            case 'both_accepted':
                return (
                    <span className="bg-emerald-100 text-emerald-900 text-xs px-2 py-1 rounded-full">
                        Both confirmed — held
                    </span>
                );
            case 'rejected':
                return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Rejected</span>;
            case 'completed':
                return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Completed</span>;
            default:
                return null;
        }
    };

    const handleOwnerAccept = async () => {
        if (
            !confirm(
                'Accept this exchange offer? The requester must also confirm before your books are held for the swap.'
            )
        )
            return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'exchanges', request.id), {
                ownerAccepted: true,
                updatedAt: serverTimestamp(),
            });
            notifyExchangeParty({
                recipientUserId: request.requesterId,
                title: 'Exchange offer accepted',
                message: `${request.ownerName || 'The listing owner'} accepted your exchange for "${request.requestedBookTitle}". Open Dashboard → Exchanges to confirm and finalize the swap.`,
                exchangeId: request.id,
            });
            toast.success('You accepted. Waiting for the other person to confirm.');
        } catch {
            toast.error('Failed to accept exchange');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRequesterConfirm = async () => {
        if (!confirm('Confirm this exchange? Both listings will be held for your swap.')) return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'exchanges', request.id), {
                requesterAccepted: true,
                updatedAt: serverTimestamp(),
            });
            const snap = await getDoc(doc(db, 'exchanges', request.id));
            const d = snap.data();
            if (d?.ownerAccepted && d?.requesterAccepted) {
                await finalizeDualAccept(request.id, request);
                toast.success('Exchange confirmed — see Reservations.');
            } else {
                toast.message('Waiting for the owner to accept first.');
            }
        } catch {
            toast.error('Failed to confirm exchange');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecline = async () => {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return;

        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'exchanges', request.id), {
                status: 'rejected',
                rejectionReason: reason || 'No reason provided',
                updatedAt: serverTimestamp(),
            });
            notifyExchangeParty({
                recipientUserId: request.requesterId,
                title: 'Exchange offer declined',
                message: `Your exchange offer for "${request.requestedBookTitle}" was declined.${reason ? ` Note: ${reason}` : ''}`,
                exchangeId: request.id,
            });
            toast.success('Exchange rejected.');
        } catch {
            toast.error('Failed to reject exchange');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelOffer = async () => {
        if (!confirm('Cancel this exchange offer?')) return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'exchanges', request.id), {
                status: 'rejected',
                rejectionReason: 'Cancelled by requester',
                updatedAt: serverTimestamp(),
            });
            notifyExchangeParty({
                recipientUserId: request.ownerId,
                title: 'Exchange offer cancelled',
                message: `${request.requesterName || 'The requester'} cancelled their exchange offer for "${request.requestedBookTitle}".`,
                exchangeId: request.id,
            });
            toast.success('Offer cancelled.');
        } catch {
            toast.error('Failed to cancel offer');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChat = () => {
        const otherId = isIncoming ? request.requesterId : request.ownerId;
        const otherName = isIncoming ? request.requesterName : request.ownerName;
        const otherAvatar = isIncoming ? request.requesterAvatar || '' : '';
        navigate(`/chat/${chatId}`, {
            state: {
                otherUser: {
                    id: otherId,
                    name: otherName,
                    avatar: otherAvatar,
                    online: false,
                },
                bookContext: {
                    id: request.requestedBookId,
                    title: request.requestedBookTitle,
                    price: 0,
                    image: request.requestedBookImage,
                },
            },
        });
    };

    const ownerAccepted = !!request.ownerAccepted;
    const pending = request.status === 'pending' || request.status === 'chatting' || request.status === 'accepted';
    const showOwnerAccept = isIncoming && pending && !ownerAccepted && uid === request.ownerId;
    const showOwnerWaiting = isIncoming && pending && ownerAccepted && !requesterAccepted;
    const showRequesterConfirm = !isIncoming && pending && ownerAccepted && !requesterAccepted && uid === request.requesterId;
    const showRequesterWaiting = !isIncoming && pending && !ownerAccepted && uid === request.requesterId;
    const showChat =
        request.status !== 'rejected' &&
        (request.status === 'both_accepted' || pending || request.status === 'completed');

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-gray-500">
                        {isIncoming ? `From ${request.requesterName}` : `To ${request.ownerName}`}
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{isIncoming ? 'Your Book' : 'Requested'}</div>
                    <div className="flex gap-2">
                        <img
                            src={request.requestedBookImage}
                            className="w-12 h-16 object-cover rounded shadow-sm"
                            alt=""
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{request.requestedBookTitle}</p>
                        </div>
                    </div>
                </div>

                <div className="text-gray-300">
                    <ArrowLeftRight className="w-5 h-5" />
                </div>

                <div className="flex-1 text-right">
                    <div className="text-xs text-gray-500 mb-1">{isIncoming ? 'Offered' : 'Your Offer'}</div>
                    <div className="flex gap-2 flex-row-reverse">
                        <img
                            src={request.offeredBookImage}
                            className="w-12 h-16 object-cover rounded shadow-sm"
                            alt=""
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 text-right">
                            <p className="font-medium text-sm truncate">{request.offeredBookTitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                    {showOwnerAccept && (
                        <>
                            <Button
                                size="sm"
                                onClick={handleOwnerAccept}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                            >
                                <Check className="w-4 h-4 mr-1" /> Accept offer
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleDecline}
                                disabled={isProcessing}
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                            >
                                <X className="w-4 h-4 mr-1" /> Decline
                            </Button>
                        </>
                    )}
                    {showOwnerWaiting && (
                        <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            Waiting for the requester to confirm
                        </span>
                    )}
                    {showRequesterWaiting && (
                        <>
                            <Button
                                size="sm"
                                onClick={handleCancelOffer}
                                disabled={isProcessing}
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                            >
                                Cancel offer
                            </Button>
                        </>
                    )}
                    {showRequesterConfirm && (
                        <Button
                            size="sm"
                            onClick={handleRequesterConfirm}
                            disabled={isProcessing}
                            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white h-8"
                        >
                            <Check className="w-4 h-4 mr-1" /> Confirm exchange
                        </Button>
                    )}
                    {showChat && (
                        <Button size="sm" variant="outline" onClick={handleChat} className="text-[#C4A672] border-[#C4A672] h-8">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                        </Button>
                    )}
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                    <span className="text-xs text-red-500 italic">&quot;{request.rejectionReason}&quot;</span>
                )}
            </div>
        </div>
    );
}
