import React, { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AIAssistantMessageContent } from '../AI/AIChatMessage';
import { cn } from '../ui/utils';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('bookbloom_ai_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUserId = auth.currentUser?.uid;

  // Persist messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('bookbloom_ai_chat', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId),
      where('type', '==', 'ai_assistant'),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasNotification(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleAIChat', handleToggle);
    return () => window.removeEventListener('toggleAIChat', handleToggle);
  }, []);

  const toggleChat = async () => {
    if (!isOpen && hasNotification && currentUserId) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUserId),
        where('type', '==', 'ai_assistant'),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      snapshot.forEach((notificationDoc) => {
        updateDoc(doc(db, 'notifications', notificationDoc.id), { read: true });
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newUserMessage: Message = { role: 'user', parts: [{ text: userMessage }] };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const generateResponse = httpsCallable(functions, 'generateAssistantResponse', {
        timeout: 30000
      });
      const result = await generateResponse({ 
        prompt: userMessage, 
        history: messages 
      }) as any;

      if (result.data && result.data.text) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.data.text }] }]);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error: any) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "Sorry, I'm having trouble connecting to my servers right now. Please try again in a moment." }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close assistant"
          className="fixed inset-0 z-40 animate-in fade-in duration-200 sm:hidden bg-slate-900/35 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={cn(
          'fixed z-50',
          isOpen
            ? 'inset-x-0 bottom-0 flex justify-center sm:inset-auto sm:bottom-6 sm:right-6 sm:justify-end'
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6',
        )}
      >
        {!isOpen ? (
          <div className="relative">
            <Button
              type="button"
              onClick={toggleChat}
              aria-label={hasNotification ? 'Open AI assistant (you have a new message)' : 'Open AI assistant'}
              aria-expanded={false}
              className="relative h-14 w-14 shrink-0 rounded-full bg-[#C4A672] shadow-xl ring-2 ring-white/70 hover:bg-[#8B7355] focus-visible:ring-2 focus-visible:ring-[#C4A672] focus-visible:ring-offset-2"
            >
              <MessageSquare className="h-6 w-6 text-white" aria-hidden />
            </Button>
            {hasNotification && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-red-500" />
              </span>
            )}
          </div>
        ) : (
          <Card
            className={cn(
              'flex min-h-0 w-full max-w-lg flex-col gap-0 overflow-hidden border-[#C4A672]/30 bg-white/98 shadow-2xl backdrop-blur-sm sm:bg-card',
              'max-h-[min(88dvh,40rem)] sm:h-[500px] sm:w-[min(24rem,calc(100vw-2rem))]',
              'rounded-t-[1.35rem] border-x-0 border-b-0 sm:rounded-xl sm:border',
              'animate-in fade-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:duration-200',
              'pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0',
            )}
          >
            <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden>
              <div className="h-1.5 w-12 rounded-full bg-slate-300/80" />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 rounded-t-[inherit] bg-gradient-to-r from-[#C4A672] to-[#8B7355] px-4 py-3.5 text-white shadow-sm sm:py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Bot className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">BookBloom Assistant</p>
                  <p className="truncate text-xs text-white/85">Books, rentals &amp; tutoring</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 shrink-0 text-white hover:bg-white/15 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-slate-50/90 to-slate-100/80 px-3 py-4 sm:px-4
                [scrollbar-width:thin] [scrollbar-color:#c4b5a8_#f4f4f5]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c4b5a8]/70
                hover:[&::-webkit-scrollbar-thumb]:bg-[#b09a7a]"
            >
              {messages.length === 0 && (
                <div className="mx-auto mt-6 max-w-[18rem] text-center sm:mt-8">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-[#C4A672]/20 blur-xl" aria-hidden />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-[#C4A672]/25">
                      <Bot className="h-7 w-7 text-[#C4A672]" aria-hidden />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-800">Hi there</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Ask about listings, rentals, exchanges, or finding a tutor — I&apos;m here to help.
                  </p>
                </div>
              )}
              <div className="space-y-3 sm:space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex gap-2.5 sm:gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                  >
                    <Avatar className="mt-0.5 h-8 w-8 shrink-0 border border-white/80 shadow-sm sm:h-9 sm:w-9">
                      <AvatarFallback
                        className={cn(
                          msg.role === 'user'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-[#C4A672]/15 text-[#6b5a3e]',
                        )}
                      >
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4" aria-hidden />
                        ) : (
                          <Bot className="h-4 w-4" aria-hidden />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[min(100%,20rem)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[85%]',
                        msg.role === 'user'
                          ? 'rounded-tr-md bg-[#C4A672] text-white'
                          : 'rounded-tl-md border border-slate-200/80 bg-white text-slate-800',
                      )}
                    >
                      <div className="break-words">
                        {msg.role === 'user' ? (
                          msg.parts[0].text
                        ) : (
                          <AIAssistantMessageContent
                            text={msg.parts[0].text}
                            proseClassName="prose prose-sm max-w-none text-slate-800 prose-p:my-1 prose-p:leading-snug prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-strong:text-slate-900"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2.5 sm:gap-3">
                    <Avatar className="mt-0.5 h-8 w-8 shrink-0 border border-white/80 shadow-sm sm:h-9 sm:w-9">
                      <AvatarFallback className="bg-[#C4A672]/15">
                        <Bot className="h-4 w-4 text-[#6b5a3e]" aria-hidden />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-[#C4A672]" aria-hidden />
                      <span className="text-xs text-slate-500">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur-sm sm:rounded-b-xl sm:px-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="min-h-11 flex-1 border-slate-200 bg-slate-50/80 text-sm shadow-inner focus-visible:ring-[#C4A672]/40 sm:min-h-10"
                  aria-label="Message to assistant"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading}
                  className="h-11 w-11 shrink-0 bg-[#C4A672] hover:bg-[#8B7355] sm:h-10 sm:w-10"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
