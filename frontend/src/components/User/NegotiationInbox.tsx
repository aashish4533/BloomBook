import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Check, X, MessageSquare } from 'lucide-react';
import { startChatWithUser } from '../../utils/chatUtils';

function formatRs(n: number) {
  return `Rs. ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface Negotiation {
  id: string;
  bookId: string;
  bookTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName?: string;
  originalPrice?: number;
  offerPrice: number;
  sellerCounter?: number | null;
  agreedPrice?: number | null;
  buyerDealOk?: boolean;
  sellerDealOk?: boolean;
  listingPriceApplied?: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'agreed';
  createdAt: any;
}

export function NegotiationInbox() {
  const navigate = useNavigate();
  const [asSeller, setAsSeller] = useState<Negotiation[]>([]);
  const [asBuyer, setAsBuyer] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterById, setCounterById] = useState<Record<string, string>>({});
  const [buyerCounterById, setBuyerCounterById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    const qs = query(
      collection(db, 'negotiations'),
      where('sellerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const qb = query(
      collection(db, 'negotiations'),
      where('buyerId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubS = onSnapshot(
      qs,
      (snapshot) => {
        setAsSeller(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Negotiation))
        );
        setLoading(false);
      },
      (err) => {
        console.error('negotiations (seller):', err);
        setLoading(false);
      }
    );

    const unsubB = onSnapshot(
      qb,
      (snapshot) => {
        setAsBuyer(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Negotiation)));
        setLoading(false);
      },
      (err) => {
        console.error('negotiations (buyer):', err);
        setLoading(false);
      }
    );

    return () => {
      unsubS();
      unsubB();
    };
  }, []);

  const notify = async (userId: string, title: string, message: string, extra?: Record<string, unknown>) => {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'system',
      title,
      message,
      read: false,
      timestamp: serverTimestamp(),
      ...extra,
    });
  };

  const openChat = async (
    otherUserId: string,
    otherName: string,
    bookId: string,
    bookTitle: string,
    preview?: string
  ) => {
    const u = auth.currentUser;
    if (!u) {
      toast.error('Log in to chat');
      return;
    }
    await startChatWithUser(
      navigate,
      u.uid,
      otherUserId,
      { name: otherName, avatar: '' },
      preview
        ? {
            id: bookId,
            title: bookTitle,
            price: 0,
            initialChatMessage: preview,
          }
        : { id: bookId, title: bookTitle, price: 0 }
    );
  };

  const reject = async (offer: Negotiation) => {
    try {
      await updateDoc(doc(db, 'negotiations', offer.id), { status: 'rejected' });
      const u = auth.currentUser!;
      const peerId = u.uid === offer.sellerId ? offer.buyerId : offer.sellerId;
      const peerIsBuyer = u.uid === offer.sellerId;
      await notify(
        peerId,
        'Offer declined',
        `${u.displayName || 'The other party'} declined the negotiation for "${offer.bookTitle}".`,
        { negotiationId: offer.id, bookId: offer.bookId }
      );
      toast.success('Negotiation marked as declined');
    } catch {
      toast.error('Update failed');
    }
  };

  /** Seller accepts buyer's current offer → both agree at offerPrice */
  const sellerAcceptOffer = async (offer: Negotiation) => {
    try {
      await updateDoc(doc(db, 'negotiations', offer.id), {
        status: 'agreed',
        agreedPrice: offer.offerPrice,
        sellerDealOk: true,
        buyerDealOk: true,
        sellerCounter: null,
      });
      await notify(
        offer.buyerId,
        'Deal agreed',
        `Seller agreed to ${formatRs(offer.offerPrice)} for "${offer.bookTitle}". They should update the listing price, then you can reserve the book.`,
        { negotiationId: offer.id, bookId: offer.bookId }
      );
      toast.success('Deal recorded — update the listing price to match');
    } catch {
      toast.error('Failed to accept');
    }
  };

  /** Seller sends a counter */
  const sellerSendCounter = async (offer: Negotiation) => {
    const raw = counterById[offer.id] ?? '';
    const n = parseFloat(raw);
    if (Number.isNaN(n) || n <= 0) {
      toast.error('Enter a valid counter amount');
      return;
    }
    try {
      await updateDoc(doc(db, 'negotiations', offer.id), {
        sellerCounter: n,
        status: 'pending',
        agreedPrice: null,
        sellerDealOk: true,
        buyerDealOk: false,
      });
      await notify(
        offer.buyerId,
        'Counter offer',
        `Seller countered at ${formatRs(n)} for "${offer.bookTitle}". Open Negotiations to accept or counter.`,
        { negotiationId: offer.id, bookId: offer.bookId }
      );
      toast.success('Counter sent to buyer');
      setCounterById((m) => ({ ...m, [offer.id]: '' }));
    } catch {
      toast.error('Failed to send counter');
    }
  };

  /** Buyer accepts seller's counter */
  const buyerAcceptCounter = async (offer: Negotiation) => {
    const cap = offer.sellerCounter;
    if (cap == null) return;
    try {
      await updateDoc(doc(db, 'negotiations', offer.id), {
        status: 'agreed',
        agreedPrice: cap,
        offerPrice: cap,
        buyerDealOk: true,
        sellerDealOk: true,
      });
      await notify(
        offer.sellerId,
        'Deal agreed',
        `${offer.buyerName || 'The buyer'} agreed to ${formatRs(cap)} for "${offer.bookTitle}". Update the listing price so they can reserve.`,
        { negotiationId: offer.id, bookId: offer.bookId }
      );
      toast.success('You agreed — seller will update the listing price');
    } catch {
      toast.error('Failed to confirm');
    }
  };

  /** Buyer sends a new offer (counter back) */
  const buyerSendCounter = async (offer: Negotiation) => {
    const raw = buyerCounterById[offer.id] ?? '';
    const n = parseFloat(raw);
    if (Number.isNaN(n) || n <= 0) {
      toast.error('Enter a valid offer');
      return;
    }
    try {
      await updateDoc(doc(db, 'negotiations', offer.id), {
        offerPrice: n,
        sellerCounter: null,
        status: 'pending',
        agreedPrice: null,
        buyerDealOk: true,
        sellerDealOk: false,
      });
      await notify(
        offer.sellerId,
        'Buyer countered',
        `${offer.buyerName || 'A buyer'} offered ${formatRs(n)} for "${offer.bookTitle}".`,
        { negotiationId: offer.id, bookId: offer.bookId }
      );
      toast.success('Your offer was sent');
      setBuyerCounterById((m) => ({ ...m, [offer.id]: '' }));
    } catch {
      toast.error('Failed to send offer');
    }
  };

  const effectiveAgreedPrice = (offer: Negotiation) =>
    offer.agreedPrice ?? (offer.status === 'accepted' ? offer.offerPrice : null);

  const applyPriceToListing = async (offer: Negotiation) => {
    const p = effectiveAgreedPrice(offer);
    if (p == null) return;
    try {
      await updateDoc(doc(db, 'books', offer.bookId), {
        price: p,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'negotiations', offer.id), { listingPriceApplied: true });
      await notify(
        offer.buyerId,
        'Listing updated',
        `"${offer.bookTitle}" is now listed at ${formatRs(p)}. You can reserve it from the book page.`,
        { negotiationId: offer.id, bookId: offer.bookId }
      );
      toast.success('Book price updated');
    } catch {
      toast.error('Could not update book');
    }
  };

  const renderSellerCard = (offer: Negotiation) => {
    const orig = offer.originalPrice ?? offer.offerPrice;
    const agreed = offer.status === 'agreed' || offer.status === 'accepted';
    const rejected = offer.status === 'rejected';
    const showAgreedPrice = effectiveAgreedPrice(offer);

    return (
      <Card key={offer.id} className="p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg text-[#2C3E50]">{offer.bookTitle}</h3>
            <p className="text-sm text-gray-600">Buyer: {offer.buyerName}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-sm">
              <span className="text-gray-500">Listed: {formatRs(orig)}</span>
              <span className="font-bold text-[#C4A672]">Buyer offer: {formatRs(offer.offerPrice)}</span>
              {offer.sellerCounter != null && (
                <span className="text-gray-700">Your counter: {formatRs(offer.sellerCounter)}</span>
              )}
              {showAgreedPrice != null && agreed && (
                <span className="text-green-700 font-medium">Agreed: {formatRs(showAgreedPrice)}</span>
              )}
            </div>
          </div>
          <Badge variant={rejected ? 'destructive' : agreed ? 'default' : 'secondary'}>
            {rejected ? 'DECLINED' : agreed ? 'AGREED' : 'PENDING'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              openChat(
                offer.buyerId,
                offer.buyerName,
                offer.bookId,
                offer.bookTitle,
                `Following up on "${offer.bookTitle}" — let's finalize pickup details.`
              )
            }
          >
            <MessageSquare className="w-4 h-4 mr-1" /> Chat
          </Button>
        </div>

        {!rejected && !agreed && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end flex-wrap">
            <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => sellerAcceptOffer(offer)}>
              <Check className="w-4 h-4 mr-1" /> Accept buyer offer
            </Button>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Counter (Rs.)"
                className="w-36"
                value={counterById[offer.id] ?? ''}
                onChange={(e) => setCounterById((m) => ({ ...m, [offer.id]: e.target.value }))}
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => sellerSendCounter(offer)}>
                Send counter
              </Button>
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => reject(offer)}>
              <X className="w-4 h-4 mr-1" /> Decline
            </Button>
          </div>
        )}

        {agreed && !offer.listingPriceApplied && (
          <Button type="button" className="bg-[#C4A672] hover:bg-[#8B7355] text-white" onClick={() => applyPriceToListing(offer)}>
            Apply agreed price to listing
          </Button>
        )}
        {agreed && offer.listingPriceApplied && (
          <p className="text-sm text-green-700">Listing price has been updated.</p>
        )}
      </Card>
    );
  };

  const renderBuyerCard = (offer: Negotiation) => {
    const orig = offer.originalPrice ?? offer.offerPrice;
    const agreed = offer.status === 'agreed' || offer.status === 'accepted';
    const rejected = offer.status === 'rejected';
    const showAgreedPrice = effectiveAgreedPrice(offer);
    const hasSellerCounter = offer.sellerCounter != null && !agreed;

    return (
      <Card key={`b-${offer.id}`} className="p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg text-[#2C3E50]">{offer.bookTitle}</h3>
            <p className="text-sm text-gray-600">Seller: {offer.sellerName || 'Seller'}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-sm">
              <span className="text-gray-500">Was listed: {formatRs(orig)}</span>
              <span className="font-bold text-[#C4A672]">Your offer: {formatRs(offer.offerPrice)}</span>
              {hasSellerCounter && (
                <span className="text-gray-800">Seller asks: {formatRs(offer.sellerCounter!)}</span>
              )}
              {showAgreedPrice != null && agreed && (
                <span className="text-green-700 font-medium">Agreed: {formatRs(showAgreedPrice)}</span>
              )}
            </div>
          </div>
          <Badge variant={rejected ? 'destructive' : agreed ? 'default' : 'secondary'}>
            {rejected ? 'DECLINED' : agreed ? 'AGREED' : 'PENDING'}
          </Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            openChat(
              offer.sellerId,
              offer.sellerName || 'Seller',
              offer.bookId,
              offer.bookTitle,
              `About "${offer.bookTitle}" — confirming our negotiated price.`
            )
          }
        >
          <MessageSquare className="w-4 h-4 mr-1" /> Chat
        </Button>

        {!rejected && !agreed && hasSellerCounter && (
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap sm:items-end">
            <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => buyerAcceptCounter(offer)}>
              Accept seller&apos;s {formatRs(offer.sellerCounter!)}
            </Button>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Your counter (Rs.)"
                className="w-40"
                value={buyerCounterById[offer.id] ?? ''}
                onChange={(e) => setBuyerCounterById((m) => ({ ...m, [offer.id]: e.target.value }))}
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => buyerSendCounter(offer)}>
                Send new offer
              </Button>
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => reject(offer)}>
              Withdraw
            </Button>
          </div>
        )}

        {!rejected && !agreed && !hasSellerCounter && (
          <p className="text-sm text-gray-600">Waiting for the seller to respond to your offer.</p>
        )}

        {agreed && (
          <p className="text-sm text-gray-700">
            When the seller applies this price to the listing, open the book page and use <strong>Buy Now</strong> to reserve
            (local pickup, Rs.).
          </p>
        )}
      </Card>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading offers...</div>;

  const sellerEmpty = asSeller.length === 0;
  const buyerEmpty = asBuyer.length === 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Negotiations</h1>

      <section>
        <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">Offers on your books</h2>
        {sellerEmpty ? (
          <Card className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No incoming offers.</p>
          </Card>
        ) : (
          <div className="space-y-4">{asSeller.map(renderSellerCard)}</div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">Your offers as buyer</h2>
        {buyerEmpty ? (
          <Card className="p-8 text-center text-gray-500">
            <p>You have not sent any offers yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">{asBuyer.map(renderBuyerCard)}</div>
        )}
      </section>
    </div>
  );
}
