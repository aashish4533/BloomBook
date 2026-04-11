import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, getDocs, query, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { NavigateFunction } from 'react-router-dom';
import { notifyChatRecipient } from './chatNotifications';

/** Opens (or continues) a 1:1 chat from a notes-hub material request; first message explains context. */
export async function openMaterialRequestChat(
  navigate: NavigateFunction,
  currentUid: string,
  request: {
    id: string;
    title: string;
    course: string;
    requesterId: string;
    requesterName: string;
  }
): Promise<void> {
  if (currentUid === request.requesterId) {
    return;
  }

  const targetUserId = request.requesterId;
  const chatId = [currentUid, targetUserId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);

  await setDoc(
    chatRef,
    {
      participants: [currentUid, targetUserId],
      status: 'active',
      materialRequestId: request.id,
      topic: `${request.course} — ${request.title}`,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const initialMessage = `Hi ${request.requesterName}, I'm responding to your material request "${request.title}" (${request.course}). I'll share the file in this chat — use the attach button to send material.`;
  const firstMsgSnap = await getDocs(query(collection(db, 'chats', chatId, 'messages'), limit(1)));
  if (firstMsgSnap.empty) {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: initialMessage,
      senderId: currentUid,
      createdAt: serverTimestamp(),
      displayName: auth.currentUser?.displayName || 'User',
    });
    await updateDoc(chatRef, {
      lastMessage: initialMessage,
      updatedAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
    });
    notifyChatRecipient({
      recipientUserId: targetUserId,
      senderLabel: auth.currentUser?.displayName || 'Someone',
      preview: initialMessage,
      chatId,
    });
  }

  navigate(`/chat/${chatId}`, {
    state: {
      otherUser: {
        id: targetUserId,
        name: request.requesterName,
        avatar: '',
        online: true,
      },
    },
  });
}

export const startChatWithUser = async (
  navigate: NavigateFunction,
  currentUserId: string,
  targetUserId: string,
  targetUser: { name: string; avatar: string },
  bookContext?: any
) => {
  const chatId = [currentUserId, targetUserId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);

  await setDoc(
    chatRef,
    {
      participants: [currentUserId, targetUserId],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
    },
    { merge: true }
  );

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
    } else if (bookContext.initialChatMessage) {
      initialMessage = bookContext.initialChatMessage;
    } else if (bookContext.id && bookContext.title) {
      initialMessage = `Hi, I'm interested in "${bookContext.title}" (listed at Rs. ${bookContext.price}).`;
    }

    if (initialMessage) {
      // Create the initial message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: initialMessage,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser?.displayName || 'User',
      });
      // Update the chat document with latest message for the chat list
      await updateDoc(chatRef, {
        lastMessage: initialMessage,
        lastMessageTimestamp: serverTimestamp()
      });
      notifyChatRecipient({
        recipientUserId: targetUserId,
        senderLabel: auth.currentUser?.displayName || 'Someone',
        preview: initialMessage,
        chatId,
      });
      // Clear bookContext to prevent ChatInterface from sending its own card if applicable
      bookContext = undefined; 
    }
  }

  navigate(`/chat/${chatId}`, {
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
