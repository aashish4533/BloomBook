import React, { useState, useRef, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const functions = getFunctions();
  const currentUserId = auth.currentUser?.uid;

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
      const generateResponse = httpsCallable(functions, 'generateAssistantResponse');
      const result = await generateResponse({ 
        prompt: userMessage, 
        history: messages 
      }) as any;

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.data.text }] }]);
    } catch (error: any) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "⚠️ Atmospheric Distortion: Neural Core desynchronized. Please stabilize parameters or retry later." }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <div className="relative">
          <Button 
            onClick={toggleChat}
            className="rounded-full h-14 w-14 shadow-lg bg-[#C4A672] hover:bg-[#8B7355] relative"
          >
            <MessageSquare className="text-white" />
          </Button>
          {hasNotification && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white"></span>
            </span>
          )}
        </div>
      ) : (
        <Card className="w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl border-[#C4A672]/30">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium">BloomBook AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <ScrollArea className="flex-1 p-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Welcome! How can I assist you with your books or tutoring today?</p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={msg.role === 'user' ? 'bg-blue-100' : 'bg-[#C4A672]/20'}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#C4A672]" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                    msg.role === 'user' 
                    ? 'bg-[#C4A672] text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 animate-pulse bg-gray-200" />
                  <div className="bg-white border p-3 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C4A672]" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Footer */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <Input
                placeholder="Ask about books, rentals, or tutors..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading} className="bg-[#C4A672] hover:bg-[#8B7355]">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
