import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/** In-app Firestore notification for the recipient when someone sends a 1:1 chat message. */
export function notifyChatRecipient(params: {
  recipientUserId: string;
  senderLabel: string;
  preview: string;
  chatId?: string;
}): void {
  const { recipientUserId, senderLabel, preview, chatId } = params;
  if (!recipientUserId) return;
  const safePreview =
    preview.length > 500 ? `${preview.slice(0, 497)}…` : preview;
  void addDoc(collection(db, 'notifications'), {
    userId: recipientUserId,
    type: 'message',
    title: `Message from ${senderLabel || 'Someone'}`,
    message: safePreview,
    read: false,
    timestamp: serverTimestamp(),
    ...(chatId ? { chatId } : {}),
  }).catch((err) => console.warn('notifyChatRecipient:', err));
}
