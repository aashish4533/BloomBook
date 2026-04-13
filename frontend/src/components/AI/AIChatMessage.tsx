import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCart } from '../../context/CartContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

/** Renders assistant text with markdown and inline [Product: id] book cards (same behavior as full-page assistant). */
export function AIAssistantMessageContent({
  text,
  proseClassName = 'prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#2C3E50] prose-pre:text-white',
}: {
  text: string;
  proseClassName?: string;
}) {
  return (
    <div className={proseClassName}>
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            const content = React.Children.toArray(children).join('');
            const productMatch = content.match(/\[Product: ([^\]]+)\]/);

            if (productMatch) {
              const [fullMatch, productId] = productMatch;
              const textBefore = content.split(fullMatch)[0];
              const textAfter = content.split(fullMatch)[1];

              return (
                <div className="mb-2">
                  <p>{textBefore}</p>
                  <AIProductCard productId={productId} />
                  <p>{textAfter}</p>
                </div>
              );
            }
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function AIProductCard({ productId }: { productId: string }) {
  const [book, setBook] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const snap = await getDoc(doc(db, 'books', productId));
        if (snap.exists()) setBook({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error('Failed to fetch book for AI card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [productId]);

  if (loading) return <div className="h-24 w-full bg-gray-100 animate-pulse rounded-lg mt-2" />;
  if (!book) return null;

  const title = String(book.title ?? '');
  const author = String(book.author ?? '');
  const image = String(book.image ?? '');
  const price = book.price as number | string | undefined;
  const sellerName = String(book.sellerName ?? 'Vendor');
  const sellerId = String(book.sellerId ?? '');
  const id = String(book.id ?? productId);

  return (
    <Card className="mt-3 overflow-hidden border-[#C4A672]/30 shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-4 p-3 bg-white">
        <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#2C3E50] truncate">{title}</h4>
          <p className="text-xs text-gray-500 truncate">{author}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[#C4A672] font-bold text-sm">Rs. {price ?? '—'}</span>
            <Button
              size="sm"
              onClick={() =>
                addToCart({
                  id,
                  title,
                  price: typeof price === 'number' ? price : Number(price) || 0,
                  image,
                  type: 'buy',
                  sellerName,
                  sellerId,
                })
              }
              className="h-7 text-[10px] px-2 bg-[#C4A672] hover:bg-[#8B7355]"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
