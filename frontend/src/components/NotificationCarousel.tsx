import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Button } from './ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'message' | 'community' | 'system';
  read: boolean;
}

interface NotificationCarouselProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationCarousel({ notifications, onDismiss, onMarkAsRead }: NotificationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (notifications.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : notifications.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < notifications.length - 1 ? prev + 1 : 0));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'order':
        return 'bg-green-50 border-green-200';
      case 'message':
        return 'bg-blue-50 border-blue-200';
      case 'community':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // If 3 or fewer notifications, show vertically stacked
  if (notifications.length <= 3) {
    return (
      <div className="space-y-3 mb-6">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getTypeColor(notification.type)} border rounded-lg p-4 shadow-subtle transition-smooth hover:shadow-card animate-fadeInUp`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Bell className="w-5 h-5 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <span className="text-xs text-gray-500 mt-2 inline-block">{notification.timestamp}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // More than 3 notifications: show carousel
  const currentNotification = notifications[currentIndex];

  return (
    <div className="mb-6 animate-fadeInUp">
      <div className={`${getTypeColor(currentNotification.type)} border rounded-lg p-4 shadow-card transition-smooth`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Bell className="w-5 h-5 mt-0.5 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{currentNotification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{currentNotification.message}</p>
              <span className="text-xs text-gray-500 mt-2 inline-block">{currentNotification.timestamp}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(currentNotification.id)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="h-8 px-2 hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {notifications.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${index === currentIndex
                    ? 'w-6 bg-blue-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                aria-label={`Go to notification ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="h-8 px-2 hover:bg-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500 mt-2">
          {currentIndex + 1} of {notifications.length}
        </div>
      </div>
    </div>
  );
}
