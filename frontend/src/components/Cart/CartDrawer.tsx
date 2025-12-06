import { X, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/button';
import { useCart } from '../../context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PaymentGateway } from '../Payment/PaymentGateway';

export function CartDrawer() {
    const { items, removeFromCart, totalAmount, clearCart } = useCart();
    const navigate = useNavigate();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleCheckoutSuccess = (transactionId: string) => {
        setIsCheckoutOpen(false);
        setIsOpen(false);
        clearCart();
        // Redirect to order tracking or history?
        navigate('/dashboard/purchases');
    };

    if (isCheckoutOpen) {
        return (
            <PaymentGateway
                amount={totalAmount}
                type="buy" // Unified logic handles type separate from gateway now ideally, but for now passing buy. Revisit PaymentGateway refactor next.
                itemTitle={`Cart Checkout (${items.length} items)`}
                onSuccess={handleCheckoutSuccess}
                onCancel={() => setIsCheckoutOpen(false)}
                cartItems={items} // Need to update PaymentGateway to accept this
            />
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <ShoppingBag className="h-5 w-5 text-gray-600" />
                    {items.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#C4A672] text-[10px] font-medium text-white flex items-center justify-center">
                            {items.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle className="text-[#2C3E50]">Your Cart ({items.length})</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Your cart is empty</p>
                            <p className="text-gray-400 text-sm mt-1">Add some books to get started</p>
                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() => setIsOpen(false)}
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 bg-gray-50 p-3 rounded-lg">
                                        <div className="h-20 w-16 bg-white rounded overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-[#2C3E50] text-sm line-clamp-2">{item.title}</h4>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Sold by {item.sellerName}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'buy' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {item.type === 'buy' ? 'Buy' : 'Rent'}
                                                </span>
                                                <span className="font-semibold text-[#C4A672]">${item.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="pt-4 mt-auto">
                        <Separator className="mb-4" />
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-[#2C3E50]">${totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold">
                                <span className="text-[#2C3E50]">Total</span>
                                <span className="text-[#C4A672]">${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={clearCart}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear Cart
                            </Button>
                            <Button
                                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                                onClick={() => setIsCheckoutOpen(true)}
                            >
                                Checkout
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
