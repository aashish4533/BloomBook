import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface WishlistItem {
    id?: string;
    userId: string;
    bookId: string;
    title: string;
    author: string;
    price: number;
    image: string;
    type: 'buy' | 'rent' | 'exchange';
    condition: string;
    available: boolean;
    createdAt?: any;
    rentDuration?: string;
    /** Normalized title|author for matching new listings (set on create). */
    matchKey?: string;
    /** Normalized ISBN for matching new listings when present. */
    isbnNorm?: string;
}

export function wishlistItemKind(item: WishlistItem): 'buy' | 'rent' | 'exchange' {
    if (item.type === 'exchange') return 'exchange';
    if (item.type === 'rent') return 'rent';
    return 'buy';
}

function wishlistMatchKey(title: string, author: string): string {
    const norm = (s: string) =>
        (s || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    return `${norm(title)}|${norm(author)}`;
}

function wishlistIsbnNorm(isbn: string | undefined): string | undefined {
    if (!isbn || typeof isbn !== 'string') return undefined;
    const x = isbn.replace(/[\s-]/g, '').toLowerCase();
    return x.length >= 10 ? x : undefined;
}

/** How this book should be stored on the wishlist when toggled from the UI. */
export function resolveWishlistType(
    book: any,
    forceType?: 'buy' | 'rent' | 'exchange'
): 'buy' | 'rent' | 'exchange' {
    if (forceType) return forceType;
    const af = book.availableFor as string[] | undefined;
    const onlyExchange =
        af?.includes('exchange') && !af?.includes('sale') && !af?.includes('rent');
    if (book.type === 'exchange' || onlyExchange) return 'exchange';
    if (book.type === 'rent') return 'rent';
    if (af?.includes('rent') && !af?.includes('sale')) return 'rent';
    return 'buy';
}

export function useWishlist() {
    const [user] = useAuthState(auth);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setWishlist([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, 'wishlists'), where('userId', '==', user.uid));

        const unsub = onSnapshot(
            q,
            (snapshot) => {
                const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WishlistItem));
                rows.sort((a, b) => {
                    const ta =
                        a.createdAt?.toMillis?.() ??
                        (typeof a.createdAt?.seconds === 'number' ? a.createdAt.seconds * 1000 : 0);
                    const tb =
                        b.createdAt?.toMillis?.() ??
                        (typeof b.createdAt?.seconds === 'number' ? b.createdAt.seconds * 1000 : 0);
                    return tb - ta;
                });
                setWishlist(rows);
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to wishlist:', error);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [user]);

    const isInWishlist = (bookId: string) => {
        return wishlist.some(item => item.bookId === bookId);
    };

    const toggleWishlist = async (
        book: any,
        options?: { forceType?: 'buy' | 'rent' | 'exchange'; mode?: 'toggle' | 'add' }
    ): Promise<boolean> => {
        if (!user) {
            toast.error("Please login to use wishlist");
            return false;
        }

        const wishlistType = resolveWishlistType(book, options?.forceType);
        const mode = options?.mode ?? 'toggle';
        const existingItem = wishlist.find(item => item.bookId === book.id);

        try {
            if (existingItem) {
                if (mode === 'add') {
                    toast.info('This book is already in your wishlist');
                    return false;
                }
                await deleteDoc(doc(db, 'wishlists', existingItem.id!));
                setWishlist(prev => prev.filter(item => item.id !== existingItem.id));
                toast.success("Removed from wishlist");
                return true;
            } else {
                const priceValue =
                    wishlistType === 'rent'
                        ? Number(book.rentPrice ?? book.price) || 0
                        : Number(book.price) || 0;
                const mk = wishlistMatchKey(String(book.title || ''), String(book.author || ''));
                const isbnN = wishlistIsbnNorm(book.isbn);
                const newItem: WishlistItem = {
                    userId: user.uid,
                    bookId: book.id,
                    title: book.title,
                    author: book.author,
                    price: priceValue,
                    image: book.images?.[0] || '',
                    type: wishlistType,
                    condition: book.condition || 'Good',
                    available: !book.isSold && !book.isRented,
                    createdAt: serverTimestamp(),
                    rentDuration: book.rentDuration || null,
                    matchKey: mk || undefined,
                    ...(isbnN ? { isbnNorm: isbnN } : {}),
                };

                const docRef = await addDoc(collection(db, 'wishlists'), newItem);
                setWishlist(prev => [...prev, { ...newItem, id: docRef.id }]);
                toast.success("Added to wishlist");
                return true;
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            toast.error("Failed to update wishlist");
            return false;
        }
    };

    return { wishlist, loading, isInWishlist, toggleWishlist };
}
