import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { auth, db } from '../../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { toast } from 'sonner';
import type { AppNotification } from '../../utils/notificationsUi';
import {
  notificationTargetPath,
  formatNotificationTimestamp,
  notificationTypeStyle,
} from '../../utils/notificationsUi';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];
        setNotifications(data);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        toast.error('Could not load notifications. Check your connection or Firestore index.');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => n.read !== true).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => n.read !== true).forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => batch.delete(doc(db, 'notifications', n.id)));
      await batch.commit();
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const openNotification = async (n: AppNotification) => {
    const path = notificationTargetPath(n);
    if (n.read !== true) await markAsRead(n.id);
    if (path) navigate(path);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#C4A672]/20 flex items-center justify-center text-[#2C3E50]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2C3E50]">Notifications</h2>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Bell className="w-14 h-14 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-500 mt-1">Orders, messages, and updates will show up here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const target = notificationTargetPath(n);
            const isUnread = n.read !== true;
            const titleText = n.title?.trim() || 'Notification';
            const messageText = n.message?.trim() ?? '';
            return (
              <li
                key={n.id}
                className={`rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden ${isUnread ? 'ring-1 ring-blue-100 bg-blue-50/30' : ''}`}
              >
                <div className="p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${notificationTypeStyle(n.type)}`}>
                        {n.type || 'general'}
                      </span>
                      <span className="text-xs text-gray-500">{formatNotificationTimestamp(n.timestamp)}</span>
                    </div>
                    <h3 className="font-medium text-[#2C3E50] break-words">{titleText}</h3>
                    <p className="text-sm text-gray-600 mt-1 break-words whitespace-pre-wrap">{messageText || '—'}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {target && (
                        <Button size="sm" onClick={() => openNotification(n)}>
                          Open
                        </Button>
                      )}
                      {isUnread && (
                        <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Mark read
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteOne(n.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
