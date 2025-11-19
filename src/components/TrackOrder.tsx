import { useState } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface TrackOrderProps {
  orderId: string;
  onBack: () => void;
}

interface OrderStatus {
  status: 'ordered' | 'confirmed' | 'shipped' | 'out-for-delivery' | 'delivered';
  timestamp: string;
  location?: string;
  description: string;
}

export function TrackOrder({ orderId, onBack }: TrackOrderProps) {
  const [orderStatuses] = useState<OrderStatus[]>([
    {
      status: 'ordered',
      timestamp: '2025-11-15 10:30 AM',
      location: 'Book Bloom Warehouse',
      description: 'Order placed successfully'
    },
    {
      status: 'confirmed',
      timestamp: '2025-11-15 11:45 AM',
      location: 'Book Bloom Warehouse',
      description: 'Order confirmed and being prepared'
    },
    {
      status: 'shipped',
      timestamp: '2025-11-16 09:00 AM',
      location: 'Distribution Center, Mumbai',
      description: 'Package shipped from warehouse'
    },
    {
      status: 'out-for-delivery',
      timestamp: '2025-11-17 08:30 AM',
      location: 'Local Delivery Hub',
      description: 'Out for delivery - Expected by 6:00 PM'
    }
  ]);

  const currentStatusIndex = orderStatuses.length - 1;
  const isDelivered = orderStatuses[currentStatusIndex]?.status === 'delivered';

  const getStatusIcon = (status: string, index: number) => {
    const isCompleted = index <= currentStatusIndex;
    const isCurrent = index === currentStatusIndex;

    let Icon = Package;
    if (status === 'shipped' || status === 'out-for-delivery') Icon = Truck;
    if (status === 'delivered') Icon = CheckCircle;

    return (
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-smooth ${
          isCompleted
            ? isCurrent
              ? 'bg-blue-600 text-white shadow-card'
              : 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-subtle sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl text-gray-900">Track Order</h1>
              <p className="text-sm text-gray-600">Order ID: {orderId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Order Summary Card */}
        <Card className="p-6 mb-6 shadow-card">
          <div className="flex items-start gap-4">
            <img
              src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100&h=150&fit=crop"
              alt="Book"
              className="w-20 h-28 object-cover rounded-lg shadow-subtle"
            />
            <div className="flex-1">
              <h3 className="text-lg text-gray-900 mb-1">The Great Gatsby</h3>
              <p className="text-sm text-gray-600 mb-2">by F. Scott Fitzgerald</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-600">₹299</span>
                <span className="text-gray-500">Qty: 1</span>
              </div>
              <div className={`inline-block mt-3 px-3 py-1 rounded-full text-sm ${
                isDelivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isDelivered ? 'Delivered' : 'In Transit'}
              </div>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6 mb-6 shadow-card">
          <h3 className="text-lg text-gray-900 mb-6">Delivery Timeline</h3>
          <div className="space-y-6">
            {orderStatuses.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStatusIcon(item.status, index)}
                  {index < orderStatuses.length - 1 && (
                    <div
                      className={`w-0.5 h-16 mt-2 transition-smooth ${
                        index < currentStatusIndex ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <h4 className="text-gray-900 capitalize mb-1">
                    {item.status.replace(/-/g, ' ')}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{item.timestamp}</span>
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Map Placeholder */}
        <Card className="p-6 mb-6 shadow-card">
          <h3 className="text-lg text-gray-900 mb-4">Live Tracking</h3>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p>Map integration placeholder</p>
              <p className="text-sm mt-1">Track your delivery in real-time</p>
            </div>
          </div>
        </Card>

        {/* Delivery Contact */}
        <Card className="p-6 shadow-card">
          <h3 className="text-lg text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-gray-50 transition-smooth"
            >
              <Phone className="w-4 h-4 mr-3" />
              Contact Delivery Partner: +91 98765 43210
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-gray-50 transition-smooth"
            >
              <Mail className="w-4 h-4 mr-3" />
              Email Support: support@bookbloom.com
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
