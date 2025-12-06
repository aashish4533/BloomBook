import { useState } from 'react';
import { Button } from '../ui/button';
import { MessageCircle, Check, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

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
    status: 'pending' | 'chatting' | 'accepted' | 'rejected' | 'completed';
    createdAt: any;
    rejectionReason?: string;
    chatId?: string;
}

interface ExchangeRequestCardProps {
    request: ExchangeRequest;
    isIncoming: boolean; // True if current user is the owner (receiving the request)
}

export function ExchangeRequestCard({ request, isIncoming }: ExchangeRequestCardProps) {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    // Status Badge Logic
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>;
            case 'chatting':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Chatting</span>;
            case 'accepted':
                return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Accepted</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Rejected</span>;
            case 'completed':
                return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Completed</span>;
            default:
                return null;
        }
    };

    const handleAccept = async () => {
        if (!confirm('Are you sure you want to accept this exchange? This may mark both books as unavailable.')) return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'exchanges', request.id), {
                status: 'accepted',
                updatedAt: serverTimestamp()
            });
            // TODO: Update book statuses logic could go here or via Cloud Functions
            toast.success('Exchange accepted!');
        } catch (err) {
            toast.error('Failed to accept exchange');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecline = async () => {
        // Ideally open a modal for reason. Implementing simple decline for now.
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return; // Cancelled

        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'exchanges', request.id), {
                status: 'rejected',
                rejectionReason: reason || 'No reason provided',
                updatedAt: serverTimestamp()
            });
            toast.success('Exchange rejected.');
        } catch (err) {
            toast.error('Failed to reject exchange');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChat = () => {
        navigate('/chat', {
            state: {
                otherUser: {
                    id: isIncoming ? request.requesterId : request.ownerId,
                    name: isIncoming ? request.requesterName : request.ownerName,
                    avatar: isIncoming ? request.requesterAvatar : '', // logic for avatar might need fetching if not stored
                    online: false
                },
                bookContext: {
                    id: request.requestedBookId,
                    title: request.requestedBookTitle,
                    price: 0,
                    image: request.requestedBookImage
                }
            }
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Header: Status and Date */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {/* Show different role label */}
                    <span className="text-xs text-gray-500">
                        {isIncoming ? `From ${request.requesterName}` : `To ${request.ownerName}`}
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
            </div>

            {/* Book Comparison */}
            <div className="flex items-center gap-4 mb-4">
                {/* Requested Book (Your book if incoming) */}
                <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{isIncoming ? 'Your Book' : 'Requested'}</div>
                    <div className="flex gap-2">
                        <img src={request.requestedBookImage} className="w-12 h-16 object-cover rounded shadow-sm" alt="" />
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{request.requestedBookTitle}</p>
                        </div>
                    </div>
                </div>

                <div className="text-gray-300">
                    <ArrowLeftRight className="w-5 h-5" />
                </div>

                {/* Offered Book (Their book if incoming) */}
                <div className="flex-1 text-right">
                    <div className="text-xs text-gray-500 mb-1">{isIncoming ? 'Offered' : 'Your Offer'}</div>
                    <div className="flex gap-2 flex-row-reverse">
                        <img src={request.offeredBookImage} className="w-12 h-16 object-cover rounded shadow-sm" alt="" />
                        <div className="min-w-0 text-right">
                            <p className="font-medium text-sm truncate">{request.offeredBookTitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                {/* Action Buttons for Incoming Pending Requests */}
                {isIncoming && request.status === 'pending' ? (
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAccept} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white h-8">
                            <Check className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" onClick={handleDecline} disabled={isProcessing} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8">
                            <X className="w-4 h-4 mr-1" /> Decline
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleChat} className="text-gray-600 h-8">
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    // Actions for other states or Sent requests
                    <div className="flex gap-2">
                        {(request.status === 'pending' || request.status === 'chatting' || request.status === 'accepted') && (
                            <Button size="sm" variant="outline" onClick={handleChat} className="text-[#C4A672] border-[#C4A672] h-8">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat
                            </Button>
                        )}
                    </div>
                )}

                {request.status === 'rejected' && request.rejectionReason && (
                    <span className="text-xs text-red-500 italic">" {request.rejectionReason} "</span>
                )}
            </div>
        </div>
    );
}

// Icon helper
import { ArrowLeftRight } from 'lucide-react';
