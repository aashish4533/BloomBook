import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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
    type: 'buy' | 'rent';
    condition: string;
    available: boolean;
    createdAt?: any;
    rentDuration?: string;
}

export function useWishlist() {
    const [user] = useAuthState(auth);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch wishlist on mount or user change
    useEffect(() => {
        if (!user) {
            setWishlist([]);
            setLoading(false);
            return;
        }

        const fetchWishlist = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem));
                setWishlist(data);
            } catch (error) {
                console.error("Error fetching wishlist:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [user]);

    const isInWishlist = (bookId: string) => {
        return wishlist.some(item => item.bookId === bookId);
    };

    const toggleWishlist = async (book: any) => {
        if (!user) {
            toast.error("Please login to use wishlist");
            return;
        }

        const existingItem = wishlist.find(item => item.bookId === book.id);

        try {
            if (existingItem) {
                // Remove
                await deleteDoc(doc(db, 'wishlists', existingItem.id!));
                setWishlist(prev => prev.filter(item => item.id !== existingItem.id));
                toast.success("Removed from wishlist");
            } else {
                // Add
                const newItem: WishlistItem = {
                    userId: user.uid,
                    bookId: book.id,
                    title: book.title,
                    author: book.author,
                    price: book.price,
                    image: book.images?.[0] || '',
                    type: book.type === 'rent' ? 'rent' : 'buy',
                    condition: book.condition || 'Good',
                    available: !book.isSold && !book.isRented,
                    createdAt: serverTimestamp(),
                    rentDuration: book.rentDuration || null
                };

                const docRef = await addDoc(collection(db, 'wishlists'), newItem);
                setWishlist(prev => [...prev, { ...newItem, id: docRef.id }]);
                toast.success("Added to wishlist");
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            toast.error("Failed to update wishlist");
        }
    };

    return { wishlist, loading, isInWishlist, toggleWishlist };
}
