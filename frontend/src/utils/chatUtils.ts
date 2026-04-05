import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
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
  
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUserId, targetUserId],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp()
    });
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
