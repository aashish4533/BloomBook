import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CartItem {
    id: string;
    title: string;
    price: number; // This can be purchase price or rental fee
    image: string;
    type: 'buy' | 'rent';
    sellerName: string;
    sellerId: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync with Firestore on Auth Change
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, 'carts', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const remoteItems = docSnap.data().items as CartItem[];
                        // Merge remote items with local items, avoiding duplicates
                        setItems(prev => {
                            const combined = [...prev, ...remoteItems];
                            const uniqueItems = Array.from(new Map(combined.map(item => [item.id + item.type, item])).values());
                            return uniqueItems;
                        });
                    } else if (items.length > 0) {
                        // If no remote cart but local has items, sync local to remote
                        await setDoc(docRef, { items });
                    }
                } catch (error) {
                    console.error("Error fetching cart from Firestore:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Save to LocalStorage and Firestore on change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));

        const user = auth.currentUser;
        if (user) {
            const saveToFirestore = async () => {
                try {
                    await setDoc(doc(db, 'carts', user.uid), { items });
                } catch (error) {
                    console.error("Error saving cart to Firestore:", error);
                }
            };
            saveToFirestore();
        }
    }, [items]);

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const addToCart = (item: CartItem) => {
        setItems((prev) => {
            if (prev.some((i) => i.id === item.id && i.type === item.type)) {
                toast.info('Item already in cart');
                return prev;
            }
            toast.success('Added to cart');
            return [...prev, item];
        });
    };

    const removeFromCart = (itemId: string) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success('Removed from cart');
    };

    const clearCart = () => {
        setItems([]);
    };

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalAmount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
