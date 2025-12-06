import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Check, X, MessageSquare } from 'lucide-react';

interface Negotiation {
    id: string;
    bookId: string;
    bookTitle: string;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    originalPrice: number;
    offerPrice: number;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: any;
}

export function NegotiationInbox() {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'negotiations'),
            where('sellerId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Negotiation));
            setNegotiations(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching negotiations:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAction = async (id: string, newStatus: 'accepted' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'negotiations', id), {
                status: newStatus
            });
            toast.success(`Offer ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update offer');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading offers...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-[#2C3E50] mb-6">Negotiation Inbox</h1>

            {negotiations.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No negotiation offers yet.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {negotiations.map((offer) => (
                        <Card key={offer.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-lg text-[#2C3E50]">{offer.bookTitle}</h3>
                                <p className="text-sm text-gray-600">From: {offer.buyerName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-500">Original: ${offer.originalPrice}</span>
                                    <span className="font-bold text-[#C4A672]">Offer: ${offer.offerPrice}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {offer.status === 'pending' ? (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleAction(offer.id, 'accepted')}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                        >
                                            <Check className="w-4 h-4 mr-1" /> Accept
                                        </Button>
                                        <Button
                                            onClick={() => handleAction(offer.id, 'rejected')}
                                            variant="destructive"
                                            size="sm"
                                        >
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <Badge variant={offer.status === 'accepted' ? 'default' : 'destructive'}>
                                        {offer.status.toUpperCase()}
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
