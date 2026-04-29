import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

/** In-app Firestore notification for the recipient when someone sends a 1:1 chat message. */
export function notifyChatRecipient(params: {
  recipientUserId: string;
  senderLabel: string;
  preview: string;
  chatId?: string;
}): void {
  const { recipientUserId, senderLabel, preview, chatId } = params;
  if (!recipientUserId) return;
  const sourceUid = auth.currentUser?.uid;
  if (!sourceUid) return;
  const safePreview =
    preview.length > 500 ? `${preview.slice(0, 497)}…` : preview;
  void addDoc(collection(db, 'notifications'), {
    userId: recipientUserId,
    sourceUid,
    type: 'message',
    title: `Message from ${senderLabel || 'Someone'}`,
    message: safePreview,
    read: false,
    timestamp: serverTimestamp(),
    ...(chatId ? { chatId } : {}),
  }).catch((err) => console.warn('notifyChatRecipient:', err));
}

/** In-app notification for exchange offers / accept / decline. */
export function notifyExchangeParty(params: {
  recipientUserId: string;
  title: string;
  message: string;
  exchangeId?: string;
}): void {
  const { recipientUserId, title, message, exchangeId } = params;
  if (!recipientUserId) return;
  const sourceUid = auth.currentUser?.uid;
  if (!sourceUid) return;
  const safeMsg = message.length > 500 ? `${message.slice(0, 497)}…` : message;
  void addDoc(collection(db, 'notifications'), {
    userId: recipientUserId,
    sourceUid,
    type: 'system',
    title,
    message: safeMsg,
    read: false,
    timestamp: serverTimestamp(),
    ...(exchangeId ? { exchangeId } : {}),
  }).catch((err) => console.warn('notifyExchangeParty:', err));
}

/** Notify all community members (except the author) when a new feed post is created. */
export function notifyCommunityMembersNewPost(params: {
  communityId: string;
  communityName: string;
  postId: string;
  authorId: string;
  authorName: string;
  contentPreview: string;
  recipientUserIds: string[];
}): void {
  const {
    communityId,
    communityName,
    postId,
    authorId,
    authorName,
    contentPreview,
    recipientUserIds,
  } = params;
  const trimmed = contentPreview.replace(/\s+/g, ' ').trim();
  const preview =
    trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
  const unique = [...new Set(recipientUserIds.filter((uid) => uid && uid !== authorId))];
  unique.forEach((userId) => {
    void addDoc(collection(db, 'notifications'), {
      userId,
      type: 'community',
      title: `New post in ${communityName}`,
      message: `${authorName}: ${preview || '(see community)'}`,
      read: false,
      timestamp: serverTimestamp(),
      communityId,
      postId,
    }).catch((err) => console.warn('notifyCommunityMembersNewPost:', err));
  });
}

/** Notify community admin when a user requests to join a private community. */
export function notifyCommunityAdminJoinRequest(params: {
  adminUserId: string;
  communityId: string;
  communityName: string;
  requesterName: string;
}): void {
  const { adminUserId, communityId, communityName, requesterName } = params;
  if (!adminUserId) return;
  const sourceUid = auth.currentUser?.uid;
  if (!sourceUid) return;
  void addDoc(collection(db, 'notifications'), {
    userId: adminUserId,
    sourceUid,
    type: 'community',
    title: 'New join request',
    message: `${requesterName} asked to join "${communityName}". Open the community to approve or decline.`,
    read: false,
    timestamp: serverTimestamp(),
    communityId,
  }).catch((err) => console.warn('notifyCommunityAdminJoinRequest:', err));
}
