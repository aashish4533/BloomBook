import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { P2PAssurancePanel } from '../Payment/P2PAssurancePanel';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface PrivateChatProps {
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
  };
  bookContext?: {
    id: string;
    title: string;
    price: number;
    image: string;
  };
  onBack: () => void;
  currentUserId: string;
  chatId: string;
}

export const PrivateChat = ({ otherUser, currentUserId, onBack, chatId }: PrivateChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const dummy = useRef<HTMLDivElement>(null);

  // 1. Subscribe to Real-time Updates
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]);

      // Auto-scroll to bottom
      // Small timeout to ensure rendering is done
      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Find active P2P transaction between these users
  useEffect(() => {
    if (!currentUserId || !otherUser.id) return;
    
    const fetchActiveTx = async () => {
      const q1 = query(collection(db, "transactions"), where("buyerId", "==", currentUserId), where("sellerId", "==", otherUser.id));
      const q2 = query(collection(db, "transactions"), where("buyerId", "==", otherUser.id), where("sellerId", "==", currentUserId));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      let txId = null;
      
      const check = (snap: any) => {
        snap.forEach((d: any) => {
          const status = d.data().status;
          if (status === 'locked_for_payment' || status === 'payment_claimed' || status === 'completed') {
            txId = d.id; // Also showing completed just so they see success, but maybe just pending
          }
        });
      };
      check(snap1);
      if (!txId) check(snap2);
      
      setActiveTransactionId(txId);
    };
    
    fetchActiveTx();
  }, [currentUserId, otherUser.id]);

  // 2. Send Message Function
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser?.displayName || "User"
      });
      // Keep the chat document in sync for the chat list
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-[calc(100dvh-2rem)] max-h-[800px]">

        {/* Header (Added to support Back navigation) */}
        <div className="bg-[#C4A672] p-4 flex items-center text-white shadow-sm">
          <button onClick={onBack} className="mr-4 hover:bg-white/20 p-1 rounded-full text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg">{otherUser.name}</div>
        </div>

        {/* User's Original UI Structure - Flex 1 to fill remaining space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* P2P Assurance Panel Header */}
          {activeTransactionId && (
             <div className="z-10 shrink-0 border-b border-gray-200">
               <P2PAssurancePanel transactionId={activeTransactionId} />
             </div>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={dummy}></div>
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2 shrink-0">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


