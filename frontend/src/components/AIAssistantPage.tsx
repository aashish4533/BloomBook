import React, { useState, useRef, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, GraduationCap, Compass, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
      const generateResponse = httpsCallable(functions, 'generateAssistantResponse');
      const result = await generateResponse({ 
        prompt: messageText, 
        history: messages 
      }) as any;

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.data.text }] }]);
    } catch (error) {
      console.error("Assistant Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      {/* Sidebar - Left side Panel */}
      <div className="hidden md:flex w-72 bg-white border-r border-[#C4A672]/20 flex-col p-4">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#C4A672]/10">
          <Link to="/" className="w-8 h-8 bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform" title="Go to Home">
            <Bot className="w-5 h-5" />
          </Link>
          <h2 className="text-[#2C3E50] font-bold text-lg">Academic Navigator</h2>
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

        <div className="pt-4 border-t border-[#C4A672]/10">
          <div className="p-4 bg-gradient-to-r from-[#2C3E50] to-[#1a252f] rounded-xl text-white text-xs">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#C4A672]" />
              <span className="font-semibold text-[#C4A672]">Neural Status</span>
            </div>
            <p className="opacity-80">Connected to Bloom Intelligence Matrix. Standard Learning Orbits active.</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Header */}
        <div className="bg-white border-b border-[#C4A672]/20 p-4 flex items-center justify-between shadow-sm md:hidden">
            <div className="flex items-center gap-2">
                <Link to="/" className="w-8 h-8 bg-[#C4A672] rounded-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform" title="Go to Home">
                    <Bot className="w-5 h-5" />
                </Link>
                <div className="text-left">
                    <h3 className="text-[#2C3E50] font-bold text-sm">BloomBook AI</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Online</p>
                </div>
            </div>
        </div>

        {/* Messages list */}
        <ScrollArea className="flex-1 p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center mt-20">
              <div className="w-16 h-16 bg-[#C4A672]/10 rounded-full flex items-center justify-center mb-4">
                 <Bot className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h2 className="text-[#2C3E50] text-xl font-bold mb-2">Welcome to your Academic Orbit</h2>
              <p className="text-gray-500 max-w-md text-sm mb-6">Ask me about tutor verification policies, renting logistics, or browse helping materials for immediate support.</p>
              
              {/* Mobile Quick Prompts */}
              <div className="flex flex-col gap-2 w-full max-w-sm md:hidden">
                 {quickPrompts.map((prompt, index) => (
                    <Button key={index} variant="outline" className="justify-start text-xs border-[#C4A672]/20 text-gray-700" onClick={() => handleSendMessage(prompt.text)}>
                       {prompt.text}
                    </Button>
                 ))}
              </div>
            </div>
          )}

          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-9 h-9 border border-gray-100 flex-shrink-0">
                  <AvatarFallback className={msg.role === 'user' ? 'bg-[#2C3E50] text-white' : 'bg-[#C4A672]/10'}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-[#C4A672]" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`p-4 rounded-2xl max-w-[70%] shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-gradient-to-r from-[#C4A672] to-[#B69661] text-white rounded-tr-none' 
                  : 'bg-white border border-[#C4A672]/10 text-gray-800 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.parts[0].text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="w-9 h-9 bg-gray-100 flex items-center justify-center animate-pulse">
                   <Bot className="w-5 h-5 text-gray-400" />
                </Avatar>
                <div className="bg-white border p-4 rounded-xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C4A672]" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Footer */}
        <div className="p-4 bg-white border-t border-[#C4A672]/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="max-w-4xl mx-auto flex gap-3 relative"
          >
            <Input
              placeholder="Query the Bloom Matrix about books, tutors, and learning orbits..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="pr-12 py-6 rounded-xl border-[#C4A672]/30 focus:ring-[#C4A672] focus:border-[#C4A672] shadow-sm text-sm"
            />
            <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading} 
                className="absolute right-2 top-2 h-8 w-8 bg-[#C4A672] hover:bg-[#8B7355] rounded-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-2">Specialized in Learning Orbits, Verification Standards, and live marketplaces.</p>
        </div>
      </div>
    </div>
  );
}
