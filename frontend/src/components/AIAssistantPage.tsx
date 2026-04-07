import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, GraduationCap, Compass, BookOpen, Clock, Menu, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

// ── Interactive AI Product Card ──────────────────────────────────────────────
const AIProductCard = ({ productId }: { productId: string }) => {
  const [book, setBook] = useState<any>(null);
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

  return (
    <Card className="mt-3 overflow-hidden border-[#C4A672]/30 shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-4 p-3 bg-white">
        <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          <img src={book.image} alt={book.title} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#2C3E50] truncate">{book.title}</h4>
          <p className="text-xs text-gray-500 truncate">{book.author}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[#C4A672] font-bold text-sm">Rs. {book.price}</span>
            <Button 
              size="sm" 
              onClick={() => addToCart({
                id: book.id,
                title: book.title,
                price: book.price,
                image: book.image,
                type: 'buy', // default to buy for cart
                sellerName: book.sellerName || 'Vendor',
                sellerId: book.sellerId || ''
              })}
              className="h-7 text-[10px] px-2 bg-[#C4A672] hover:bg-[#8B7355]"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('bookbloom_ai_messages');
    try {
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Validate structure to prevent UI crashes
      if (Array.isArray(parsed)) {
        return parsed.filter(m => m.role && m.parts && Array.isArray(m.parts));
      }
      return [];
    } catch (err) {
      console.error("Failed to parse AI session storage:", err);
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem('bookbloom_ai_messages', JSON.stringify(messages));
  }, [messages]);
  
  const functions = getFunctions();
  const user = auth.currentUser;

  const quickPrompts = [
    { text: "Find a Math tutor for O-Level", icon: GraduationCap, category: "Tutor" },
    { text: "Recommend speculative fiction books", icon: BookOpen, category: "Books" },
    { text: "Help me find physics video lectures", icon: Compass, category: "Material" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || isLoading) return;

    const newUserMessage: Message = { role: 'user', parts: [{ text: messageText }] };
    setMessages(prev => [...prev, newUserMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // 1. Add a 30-second timeout safeguard to the callable function
      const generateResponse = httpsCallable(functions, 'generateAssistantResponse', {
        timeout: 30000 
      });
      
      const result = await generateResponse({ 
        prompt: messageText, 
        history: messages 
      }) as any;
      
      // 2. Safely check for the text payload
      if (result.data && result.data.text) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.data.text }] }]);
      } else {
        throw new Error("Invalid payload received from AI core.");
      }
    } catch (error: any) {
      console.error("Neural Link Error:", error);
      
      let errorMessage = "⚠️ Atmospheric interference. I could not reach the Bloom Matrix. Please check your backend connection or API keys and try again.";
      
      if (error.code === 'deadline-exceeded') {
        errorMessage = "🕒 Neural connection timed out. The Bloom Matrix is taking too long to respond. Please try a shorter query.";
      } else if (error.code === 'unauthenticated') {
        errorMessage = "🔐 Unauthorized access. Please ensure you are logged into the BookBloom grid.";
      } else if (error.message?.includes('matrix')) {
        errorMessage = "📉 AI Matrix unstable. Please try again in 5 seconds.";
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: errorMessage }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#C4A672]/10">
        <div className="flex items-center gap-2">
          <Link to="/" className="w-8 h-8 bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform" title="Go to Home">
            <Bot className="w-5 h-5" />
          </Link>
          <h2 className="text-[#2C3E50] font-bold text-lg">Academic Navigator</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setMessages([]); sessionStorage.removeItem('bookbloom_ai_messages'); }} title="Clear Chat">
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </Button>
      </div>

      <div className="flex-1 space-y-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Directives</div>
        {quickPrompts.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
            <button
              key={index}
              onClick={() => handleSendMessage(prompt.text)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#C4A672]/10 text-gray-700 hover:text-[#2C3E50] text-sm text-left transition-colors border border-transparent hover:border-[#C4A672]/20 shadow-sm bg-white"
            >
              <div className="p-2 rounded-lg bg-[#C4A672]/10 text-[#C4A672]">
                <Icon className="w-4 h-4" />
              </div>
              <span>{prompt.text}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-[#C4A672]/10 mt-auto">
        <div className={`p-4 rounded-xl text-white text-xs ${isLoading ? 'bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse' : 'bg-gradient-to-r from-[#2C3E50] to-[#1a252f]'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Sparkles className="w-4 h-4 text-[#C4A672]" />}
            <span className={`font-semibold ${isLoading ? 'text-white' : 'text-[#C4A672]'}`}>Neural Status</span>
          </div>
          <p className="opacity-80">
            {isLoading ? 'Processing Cognitive Thread... Synchronizing Orbits.' : 'Connected to Bloom Intelligence Matrix. Standard Learning Orbits active.'}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[calc(100dvh-4rem)] bg-[#FAF8F3] overflow-hidden relative">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-72 bg-white border-r border-[#C4A672]/20 flex-col p-4">
        <SidebarContent />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Chat Header for Mobile */}
        <div className="bg-white border-b border-[#C4A672]/20 p-4 flex items-center justify-between shadow-sm md:hidden">
            <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="w-6 h-6 text-[#2C3E50]" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85%] max-w-[320px] sm:max-w-[400px] flex flex-col p-4">
                     <SheetTitle className="sr-only">AI Assistant Menu</SheetTitle>
                     <SidebarContent />
                  </SheetContent>
                </Sheet>
                <Link to="/" className="w-8 h-8 bg-[#C4A672] rounded-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform" title="Go to Home">
                    <Bot className="w-5 h-5" />
                </Link>
                <div className="text-left flex-1 pl-2">
                    <h3 className="text-[#2C3E50] font-bold text-sm">BloomBook AI</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Online</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setMessages([]); sessionStorage.removeItem('bookbloom_ai_messages'); }} title="Clear Chat">
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </Button>
            </div>
        </div>

        {/* Messages list / Centered Welcome */}
        <ScrollArea className="flex-1 px-4 md:px-6 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4">
              <div className="w-16 h-16 bg-[#C4A672]/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                 <Bot className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h1 className="text-[#2C3E50] text-3xl font-bold mb-3 tracking-tight">Welcome to the Navigator Hub</h1>
              <p className="text-gray-500 max-w-md text-sm mb-8">Ask about tutor verification, book rentals, or helping materials to accelerate your Academic Orbit.</p>
              
              {/* Centered Command Entry */}
              <div className="w-full max-w-2xl bg-white rounded-2xl p-4 shadow-xl border border-[#C4A672]/10 mb-8 transform transition-all hover:scale-[1.01]">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                  className="flex items-center gap-3 w-full"
                >
                  <div className="relative flex-grow">
                    <Input
                      placeholder="Query the Bloom Intelligence Matrix..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                      className="w-full pr-14 py-7 rounded-xl border-[#C4A672]/20 focus:ring-[#C4A672] focus:border-[#C4A672] shadow-none text-base"
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={isLoading || !input.trim()} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-[#C4A672] hover:bg-[#8B7355] rounded-xl transition-all shadow-md hover:shadow-[#C4A672]/20"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Directives Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                 {quickPrompts.map((prompt, index) => {
                    const Icon = prompt.icon;
                    return (
                      <Button 
                        key={index} 
                        variant="outline" 
                        className="bg-white justify-start gap-3 h-auto p-4 border border-[#C4A672]/10 hover:border-[#C4A672]/30 text-gray-700 rounded-xl hover:bg-[#C4A672]/5 shadow-sm transition-all text-sm font-medium" 
                        onClick={() => handleSendMessage(prompt.text)}
                      >
                         <div className="p-2 rounded-lg bg-[#C4A672]/10 text-[#C4A672]">
                           <Icon className="w-4 h-4" />
                         </div>
                         <span className="truncate">{prompt.text}</span>
                      </Button>
                    );
                 })}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto w-full pb-4">
              {messages.map((message: any, i: number) => (
                <div key={i} className={`flex items-start gap-4 w-full ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 border border-gray-100 flex-shrink-0 mt-1">
                    <AvatarFallback className={message.role === 'user' ? 'bg-[#2C3E50] text-white' : 'bg-[#C4A672]/10'}>
                      {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-[#C4A672]" />}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-[#C4A672] text-white rounded-br-none' 
                      : 'bg-white border border-gray-100 text-[#2C3E50] rounded-bl-none'
                  }`}
                >
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#2C3E50] prose-pre:text-white">
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
                        }
                      }}
                    >
                      {message.parts[0].text}
                    </ReactMarkdown>
                  </div>
                </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 md:gap-4">
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 bg-gray-100 flex items-center justify-center animate-pulse mt-1">
                     <Bot className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  </Avatar>
                  <div className="bg-white border p-3 md:p-4 rounded-xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C4A672]" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Footer - Only rendered when conversation active */}
        {messages.length > 0 && (
          <div className="p-3 md:p-4 bg-[#FAF8F3] border-t border-[#C4A672]/10 z-10 relative">
            <div className="max-w-4xl mx-auto">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                className="flex items-end gap-2 md:gap-3 w-full"
              >
                <div className="relative flex-grow">
                  <Input
                    placeholder="Query the Bloom Matrix about books, tutors, and learning orbits..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="w-full pr-14 h-14 rounded-xl border-[#C4A672]/30 focus:ring-[#C4A672] focus:border-[#C4A672] shadow-sm text-sm bg-white"
                  />
                  <Button 
                      type="submit" 
                      size="icon" 
                      disabled={isLoading || !input.trim()} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#C4A672] hover:bg-[#8B7355] rounded-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </form>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 hidden sm:block">Specialized in Learning Orbits, Verification Standards, and live marketplaces.</p>
          </div>
        )}
      </div>
    </div>
  );
}
