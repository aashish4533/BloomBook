import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NavigateFunction } from 'react-router-dom';

export const startChatWithUser = async (
  navigate: NavigateFunction,
  currentUserId: string,
  targetUserId: string,
  targetUser: { name: string; avatar: string },
  bookContext?: any
) => {
  const chatId = [currentUserId, targetUserId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);
  
  const chatSnap = await getDoc(chatRef);
  let isNewChat = false;

  if (!chatSnap.exists()) {
    isNewChat = true;
    await setDoc(chatRef, {
      participants: [currentUserId, targetUserId],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp()
    });
  }

  // Handle specific contextual initial messages
  if (bookContext) {
    let initialMessage = '';
    
    if (bookContext.type === 'tutor_booking') {
      initialMessage = `Hi, I am interested in booking a session. I saw your rate is Rs. ${bookContext.price}/hr`;
    } else if (bookContext.type === 'tuition_request') {
      initialMessage = `Hi, I am responding to your tuition request: ${bookContext.topic}`;
      // Ensure orbit_status updates to 'Assigned'
      if (bookContext.requestId) {
        await updateDoc(doc(db, 'tuition_requests', bookContext.requestId), {
          orbit_status: 'Assigned',
          assignedTutorId: currentUserId
        });
      }
    }

    if (initialMessage) {
      // Create the initial message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: initialMessage,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: "System"
      });
      // Update the chat document with latest message for the chat list
      await updateDoc(chatRef, {
        lastMessage: initialMessage,
        lastMessageTimestamp: serverTimestamp()
      });
      // Clear bookContext to prevent ChatInterface from sending its own card if applicable
      bookContext = undefined; 
    }
  }

  navigate('/chat', {
    state: {
      otherUser: {
        id: targetUserId,
        name: targetUser.name,
        avatar: targetUser.avatar,
        online: true
      },
      bookContext
    }
  });
  
  return chatId;
};
