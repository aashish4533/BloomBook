import { useState } from 'react';
import { ExchangeRequestCard } from '../Exchange/ExchangeRequestCard';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeftRight } from 'lucide-react';

export function UserExchanges() {
    const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
    const userId = auth.currentUser?.uid;

    // Fetch Incoming Requests (where ownerId == userId)
    const [incomingSnapshot, loadingIncoming, errorIncoming] = useCollection(
        userId
            ? query(
                collection(db, 'exchanges'),
                where('ownerId', '==', userId),
                orderBy('createdAt', 'desc')
            )
            : null
    );

    // Fetch Sent Requests (where requesterId == userId)
    const [sentSnapshot, loadingSent, errorSent] = useCollection(
        userId
            ? query(
                collection(db, 'exchanges'),
                where('requesterId', '==', userId),
                orderBy('createdAt', 'desc')
            )
            : null
    );

    const incomingRequests = incomingSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)) || [];
    const sentRequests = sentSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)) || [];

    if (!userId) return <div>Please log in to view exchanges.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <ArrowLeftRight className="w-6 h-6 text-[#C4A672]" />
                <h2 className="text-2xl font-semibold text-[#2C3E50]">My Exchanges</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'incoming'
                            ? 'text-[#C4A672] border-b-2 border-[#C4A672]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Incoming Requests
                    {incomingRequests.length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                            {incomingRequests.filter((r: any) => r.status === 'pending').length || incomingRequests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'sent'
                            ? 'text-[#C4A672] border-b-2 border-[#C4A672]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Sent Requests
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {activeTab === 'incoming' ? (
                    <div className="space-y-4">
                        {loadingIncoming ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#C4A672]" /></div>
                        ) : incomingRequests.length === 0 ? (
                            <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">No incoming exchange requests.</div>
                        ) : (
                            incomingRequests.map((req: any) => (
                                <ExchangeRequestCard key={req.id} request={req} isIncoming={true} />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {loadingSent ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#C4A672]" /></div>
                        ) : sentRequests.length === 0 ? (
                            <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">You haven't sent any exchange requests yet.</div>
                        ) : (
                            sentRequests.map((req: any) => (
                                <ExchangeRequestCard key={req.id} request={req} isIncoming={false} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
