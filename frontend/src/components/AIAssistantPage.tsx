import React, { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, db, functions } from '../firebase';
import { Send, Bot, User, Loader2, Sparkles, GraduationCap, Compass, BookOpen, Menu, Trash2, Reply, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { AIAssistantMessageContent } from './AI/AIChatMessage';
import { BOOKBLOOM_SITE_GUIDE_FOR_AI } from '../utils/bookbloomSiteGuide';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

const AI_STORAGE_KEY = 'bookbloom_ai_messages_v1';
const LEGACY_SESSION_KEY = 'bookbloom_ai_messages';

function loadPersistedMessages(): Message[] {
  try {
    const local = localStorage.getItem(AI_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.filter((m: Message) => m.role && m.parts && Array.isArray(m.parts));
      }
    }
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((m: Message) => m.role && m.parts && Array.isArray(m.parts));
        localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(valid));
        return valid;
      }
    }
  } catch (err) {
    console.error('Failed to load AI chat history:', err);
  }
  return [];
}

async function fetchBooksInventorySummary(): Promise<string> {
  try {
    const q = query(
      collection(db, 'books'),
      where('isSold', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    if (snap.empty) return 'No books currently available.';
    return snap.docs
      .map((docSnap) => {
        const b = docSnap.data();
        const availability = b.status || 'Available';
        return `- ID: ${docSnap.id}, Title: "${b.title}", Author: ${b.author || 'Unknown'}, Price: Rs. ${b.price ?? '—'}, Availability: ${availability} for ${b.type || 'Sale/Rent'}`;
      })
      .join('\n');
  } catch {
    return 'No live inventory currently synced.';
  }
}

async function generateClientGeminiReply(prompt: string, history: Message[]): Promise<string> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (!apiKey) throw new Error('no_client_key');

  const inventoryData = await fetchBooksInventorySummary();
  const systemInstructions = `
        CORE IDENTITY: You are the "BloomBook AI Assistant," a specialized guide for the Web-Based Platform for Book Reselling and Renting.
        TOPICAL FOCUS: Buying, selling, renting, and exchanging books; the "Hire a Tutor" module; and study materials (video lectures/solved exercises) on the platform.
        CONVERSATION & BOUNDARIES: Be friendly and conversational—reply warmly to greetings, thanks, and brief chit-chat. If the user asks for something clearly outside BloomBook (other retailers, unrelated domains, etc.), gently steer back: you help with books, rentals, exchanges, tutors, and materials on BloomBook only—offer concrete next steps.
        PRIVACY: Never disclose or discuss implementation details (frameworks, databases, or internal architecture).
        CONTENT: Do not write long unrelated essays, poems, or arbitrary code. Stay a platform guide.
        WEBSITE NAVIGATION: Use the SITE MAP below to answer where features and pages live on BookBloom (paths users can open). This is the platform map—not a live crawl of external websites.
        DATA: Only claim a book exists or give a price if it appears in the inventory list below. If unsure, say the snapshot may be incomplete and suggest browsing the marketplace. Never invent listings.
        ACADEMIC NAVIGATOR (TUTORS): When the user wants tutoring, ask for Subject, Level (Metric/Inter/O-Level), and preferred format (online/physical). Explain the "Neural Stability Gate" (tutor verification). Refer to sessions as "Learning Orbits."
        INTERACTIVE HOOK: When recommending a book from the list below, include [Product: ID] immediately after the title for the Quick View card.
        AVAILABLE INVENTORY SNAPSHOT (recent listings; server assistant has full search tools):
        ${inventoryData || 'No books currently available.'}

        ${BOOKBLOOM_SITE_GUIDE_FOR_AI}
      `;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstructions,
  });
  const cleanHistory = history.filter((m) => m.parts?.[0]?.text);
  const chat = model.startChat({
    history: cleanHistory,
    generationConfig: { maxOutputTokens: 500 },
  });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

export function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadPersistedMessages());
  const [replyTo, setReplyTo] = useState<{ role: 'user' | 'model'; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDeleteMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReplyMessage = (message: Message) => {
    const text = message.parts?.[0]?.text ?? '';
    setReplyTo({ role: message.role, text });
    setTimeout(() => {
      const el = document.getElementById('ai-assistant-input') as HTMLInputElement | null;
      el?.focus();
    }, 0);
  };

  useEffect(() => {
    try {
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to persist AI chat history:', err);
    }
  }, [messages]);

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

  const clearAllChat = () => {
    const hadMessages = messages.length > 0;
    setMessages([]);
    setReplyTo(null);
    try {
      localStorage.removeItem(AI_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      /* ignore */
    }
    if (hadMessages) {
      toast.success('All chat messages cleared.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || input.trim();
    if (!rawText || isLoading) return;

    const hasClientKey = Boolean((import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim());
    if (!auth.currentUser && !hasClientKey) {
      toast.error('Please log in to use the AI assistant, or add VITE_GEMINI_API_KEY for offline API access.');
      return;
    }

    const activeReply = !textToSend ? replyTo : null;
    const messageText = activeReply
      ? `> Replying to ${activeReply.role === 'user' ? 'my earlier message' : 'your earlier reply'}:\n> ${activeReply.text.replace(/\n/g, '\n> ').slice(0, 500)}\n\n${rawText}`
      : rawText;

    const priorHistory = messages;
    const newUserMessage: Message = { role: 'user', parts: [{ text: messageText }] };
    setMessages(prev => [...prev, newUserMessage]);
    if (!textToSend) {
      setInput('');
      setReplyTo(null);
    }
    setIsLoading(true);

    try {
      let replyText: string | null = null;

      // Prefer browser Gemini when VITE_GEMINI_API_KEY is set so a missing server secret does not block replies.
      if (hasClientKey) {
        try {
          replyText = (await generateClientGeminiReply(messageText, priorHistory)).trim();
        } catch (clientFirstErr: unknown) {
          console.warn('Client Gemini failed, trying cloud function:', clientFirstErr);
        }
      }

      if (!replyText && auth.currentUser) {
        try {
          const generateResponse = httpsCallable(functions, 'generateAssistantResponse', {
            timeout: 60000,
          });
          const result = (await generateResponse({
            prompt: messageText,
            history: priorHistory,
          })) as { data?: { text?: string } };
          if (result?.data?.text?.trim()) {
            replyText = result.data.text.trim();
          }
        } catch (fnErr: unknown) {
          console.warn('Cloud function assistant failed:', fnErr);
        }
      }

      if (!replyText) {
        throw new Error('empty_response');
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: replyText }] }]);
    } catch (error: unknown) {
      console.error('Neural Link Error:', error);
      const err = error as { code?: string; message?: string };
      const code = String(err?.code ?? '');

      let errorMessage =
        "⚠️ I could not get a response right now. If you use Cloud Functions, set the GEMINI_API_KEY secret and deploy. For local dev you can set VITE_GEMINI_API_KEY in frontend/.env.local (never commit that key).";

      if (code.includes('deadline-exceeded')) {
        errorMessage = '🕒 The request timed out. Try a shorter question.';
      } else if (code.includes('unauthenticated')) {
        errorMessage = '🔐 Please log in to BookBloom to use the assistant.';
      } else if (String(err?.message) === 'no_client_key') {
        errorMessage =
          '⚠️ The server could not answer and no VITE_GEMINI_API_KEY was found. Add your key to frontend/.env.local and restart the dev server.';
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
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
        <Button variant="ghost" size="icon" onClick={clearAllChat} disabled={isLoading} title="Delete all chat">
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs mb-3 border-[#C4A672]/30 text-[#2C3E50] hover:bg-[#C4A672]/10"
        onClick={clearAllChat}
        disabled={isLoading}
      >
        <Trash2 className="w-3.5 h-3.5 mr-2" />
        Delete all chat
      </Button>

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
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0">
        {/* Chat Header for Mobile */}
        <div className="bg-white border-b border-[#C4A672]/20 p-4 flex items-center justify-between shadow-sm md:hidden shrink-0">
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
                <Button variant="ghost" size="icon" onClick={clearAllChat} disabled={isLoading} title="Delete all chat">
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </Button>
            </div>
        </div>

        {messages.length > 0 && (
          <div className="flex shrink-0 items-center justify-end gap-2 px-3 sm:px-4 py-2 bg-white border-b border-[#C4A672]/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={clearAllChat}
              disabled={isLoading}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete all chat
            </Button>
          </div>
        )}

        {/* Messages list / Centered Welcome */}
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[min(70vh,calc(100dvh-10rem))] text-center px-2">
              <div className="w-16 h-16 bg-[#C4A672]/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                 <Bot className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h1 className="text-[#2C3E50] text-3xl font-bold mb-3 tracking-tight">Welcome to the Navigator Hub</h1>
              <p className="text-gray-500 max-w-md text-sm mb-4">Ask about tutor verification, book rentals, or helping materials to accelerate your Academic Orbit.</p>
              <p className="text-gray-400 text-xs max-w-md mb-6">
                <span className="md:hidden">Open the menu (☰) for quick prompts and </span>
                <span className="hidden md:inline">Left sidebar: </span>
                <span className="text-gray-600">Delete all chat</span> clears this conversation.
              </p>
              
              {/* Centered Command Entry */}
              <div className="w-full max-w-2xl bg-white rounded-2xl p-4 shadow-xl border border-[#C4A672]/10 mb-8 transform transition-all hover:scale-[1.01]">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                  className="flex flex-col sm:flex-row gap-3 w-full items-stretch"
                >
                  <Input
                    placeholder="Ask Bloom AI about books, tutors, or study materials…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 min-w-0 min-h-[52px] rounded-xl border-[#C4A672]/20 focus-visible:ring-2 focus-visible:ring-[#C4A672]/30 focus-visible:border-[#C4A672] shadow-none text-base"
                  />
                  <Button 
                      type="submit" 
                      disabled={isLoading || !input.trim()} 
                      className="min-h-[52px] shrink-0 px-5 sm:px-6 bg-[#C4A672] hover:bg-[#8B7355] rounded-xl shadow-md"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </Button>
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

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-4 text-xs text-gray-500 hover:text-red-600"
                onClick={clearAllChat}
                disabled={isLoading}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete all chat (reset saved conversation)
              </Button>
            </div>
          ) : (
            <div className="space-y-6 w-full pb-4">
              {messages.map((message: any, i: number) => (
                <div key={i} className={`group flex items-start gap-4 w-full ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 border border-gray-100 flex-shrink-0 mt-1">
                    <AvatarFallback className={message.role === 'user' ? 'bg-[#2C3E50] text-white' : 'bg-[#C4A672]/10'}>
                      {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-[#C4A672]" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-[#C4A672] text-white rounded-br-none'
                          : 'bg-white border border-gray-100 text-[#2C3E50] rounded-bl-none'
                      }`}
                    >
                      <AIAssistantMessageContent text={message.parts[0].text} />
                    </div>
                    <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <button
                        type="button"
                        onClick={() => handleReplyMessage(message)}
                        title="Reply to this message"
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#C4A672] hover:bg-[#C4A672]/10 transition-colors"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(i)}
                        title="Delete this message"
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          </div>
        </ScrollArea>

        {/* Input Footer - Only rendered when conversation active */}
        {messages.length > 0 && (
          <div className="p-3 md:p-4 bg-[#FAF8F3] border-t border-[#C4A672]/10 z-10 shrink-0">
            <div className="max-w-3xl lg:max-w-4xl mx-auto w-full px-2">
              {replyTo && (
                <div className="mb-2 flex items-start gap-2 bg-white border border-[#C4A672]/30 rounded-lg px-3 py-2 shadow-sm">
                  <Reply className="w-3.5 h-3.5 text-[#C4A672] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-[#C4A672] uppercase tracking-wide">
                      Replying to {replyTo.role === 'user' ? 'yourself' : 'Bloom AI'}
                    </div>
                    <div className="text-xs text-gray-600 truncate">{replyTo.text}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    title="Cancel reply"
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                className="flex gap-2 md:gap-3 w-full items-center"
              >
                <Input
                  id="ai-assistant-input"
                  placeholder={replyTo ? 'Type your reply…' : 'Ask about books, tutors, or learning resources…'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 min-w-0 min-h-12 h-12 rounded-xl border-[#C4A672]/30 focus-visible:ring-2 focus-visible:ring-[#C4A672]/30 focus-visible:border-[#C4A672] shadow-sm text-sm bg-white"
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim()} 
                    className="h-12 w-12 shrink-0 rounded-xl bg-[#C4A672] hover:bg-[#8B7355]"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </form>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 hidden sm:block max-w-3xl lg:max-w-4xl mx-auto">Specialized in Learning Orbits, verification, and the BookBloom marketplace.</p>
          </div>
        )}
      </div>
    </div>
  );
}
