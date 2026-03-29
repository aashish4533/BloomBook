import React, { useState, useRef, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, GraduationCap, Compass, BookOpen, Clock, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';

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

  const SidebarContent = () => (
    <>
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
    <div className="flex h-[calc(100vh-4rem)] bg-[#FAF8F3] overflow-hidden relative">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-72 bg-white border-r border-[#C4A672]/20 flex-col p-4">
        <SidebarContent />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
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
                <div className="text-left">
                    <h3 className="text-[#2C3E50] font-bold text-sm">BloomBook AI</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Online</p>
                </div>
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
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 border border-gray-100 flex-shrink-0 mt-1">
                    <AvatarFallback className={msg.role === 'user' ? 'bg-[#2C3E50] text-white' : 'bg-[#C4A672]/10'}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-[#C4A672]" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-r from-[#C4A672] to-[#B69661] text-white rounded-tr-none' 
                    : 'bg-white border border-[#C4A672]/10 text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.parts[0].text}</p>
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
                    placeholder="Query the Bloom Matrix..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="w-full pr-12 py-6 rounded-xl border-[#C4A672]/30 focus:ring-[#C4A672] focus:border-[#C4A672] shadow-sm text-sm bg-white"
                  />
                  <Button 
                      type="submit" 
                      size="icon" 
                      disabled={isLoading || !input.trim()} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#C4A672] hover:bg-[#8B7355] rounded-lg transition-transform hover:scale-105 active:scale-95"
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
