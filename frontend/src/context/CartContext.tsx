import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

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

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
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
