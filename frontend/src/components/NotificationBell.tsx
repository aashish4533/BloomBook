import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, X, Trash2, Settings, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import type { AppNotification } from '../utils/notificationsUi';
import {
  notificationTargetPath,
  formatNotificationTimestamp,
} from '../utils/notificationsUi';

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      setNotifications(data);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      toast.error('Could not load notifications. Check your connection or Firestore index.');
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => n.read !== true).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter((n) => n.read !== true);

      unreadNotifications.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });

      await batch.commit();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationNavigate = async (notification: AppNotification) => {
    const path = notificationTargetPath(notification);
    if (notification.read !== true) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    if (path) {
      navigate(path);
    }
  };

  const deleteNotification = async (id: string) => {
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
      notifications.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.delete(ref);
      });
      await batch.commit();
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#2C3E50] hover:bg-gray-100 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 right-0 mt-2 w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(32rem,75dvh)] flex flex-col min-h-0 overflow-hidden bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-[#2C3E50] font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="default" className="bg-red-500">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-[#C4A672] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length > 0 ? (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const target = notificationTargetPath(notification);
                    const titleText = notification.title?.trim() || 'Notification';
                    const messageText = notification.message?.trim() ?? '';
                    const isUnread = notification.read !== true;
                    return (
                      <div key={notification.id}
                      role={target ? 'button' : undefined}
                      tabIndex={target ? 0 : undefined}
                      onClick={() => target && handleNotificationNavigate(notification)}
                      onKeyDown={(e) => {
                        if (!target) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationNavigate(notification);
                        }
                      }}
                      className={`p-4 transition-colors ${target ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'} ${isUnread ? 'bg-blue-50/50' : ''
                        }`}
                    >
                      <div className="flex gap-3">

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-[#2C3E50] text-sm font-medium break-words">{titleText}</h4>
                            {isUnread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 break-words whitespace-pre-wrap">
                            {messageText || '—'}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">{formatNotificationTimestamp(notification.timestamp)}</p>
                            <div className="flex items-center gap-1">
                              {isUnread && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Mark as read"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 p-3 border-t border-gray-200 flex items-center justify-between gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-[#C4A672] hover:text-[#8B7355]">
                  <Link to="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />
                    View all
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No notifications</p>
              <p className="text-sm text-gray-400 mb-4">You&apos;re all caught up!</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                  Open notifications page
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
