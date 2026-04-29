import { Timestamp } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  type: 'order' | 'message' | 'community' | 'system' | 'community_approved' | 'community_rejected' | string;
  title: string;
  message: string;
  timestamp: unknown;
  read: boolean;
  icon?: string;
  chatId?: string;
  exchangeId?: string;
  negotiationId?: string;
  rentalId?: string;
  purchaseId?: string;
  bookId?: string;
  communityId?: string;
  postId?: string;
  /** In-app path from Cloud Functions / server (e.g. `/dashboard/rentals`, `#ai-chat`) */
  link?: string;
}

/** Map `link` from Firestore (mostly backend-written) to a React Router path. */
function pathFromStoredLink(link: string | undefined): string | null {
  if (link == null || typeof link !== 'string') return null;
  const t = link.trim();
  if (!t) return null;
  if (t.startsWith('#')) {
    if (t.toLowerCase().includes('ai-chat')) return '/assistant';
    return null;
  }
  if (!t.startsWith('/')) return null;
  // Functions use `/rentals/:id`; app lists rentals under `/dashboard/rentals`
  if (/^\/rentals\/[^/]+$/.test(t)) return '/dashboard/rentals';
  return t;
}

export function notificationTargetPath(n: AppNotification): string | null {
  if (n.chatId) return `/chat/${n.chatId}`;
  if (n.exchangeId) return '/dashboard/exchanges';
  if (n.negotiationId) return '/dashboard/negotiations';
  if (n.rentalId) return `/rental/${n.rentalId}/handover`;
  if (n.bookId) return `/book/${n.bookId}`;
  if (n.purchaseId) return '/dashboard/purchases';
  if (n.communityId) {
    return n.postId
      ? `/communities/${n.communityId}?post=${encodeURIComponent(n.postId)}`
      : `/communities/${n.communityId}`;
  }
  return pathFromStoredLink(n.link);
}

export function formatNotificationTimestamp(timestamp: unknown): string {
  if (timestamp == null) return '';

  const date =
    timestamp instanceof Timestamp
      ? timestamp.toDate()
      : typeof (timestamp as { toDate?: () => Date })?.toDate === 'function'
        ? (timestamp as { toDate: () => Date }).toDate()
        : new Date(timestamp as string | number);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function notificationTypeStyle(type: string): string {
  switch (type) {
    case 'order':
      return 'bg-green-100 text-green-600';
    case 'message':
      return 'bg-blue-100 text-blue-600';
    case 'community':
      return 'bg-purple-100 text-purple-600';
    case 'system':
      return 'bg-orange-100 text-orange-600';
    case 'community_approved':
      return 'bg-green-100 text-green-600';
    case 'community_rejected':
      return 'bg-red-100 text-red-600';
    case 'ai_assistant':
      return 'bg-sky-100 text-sky-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
