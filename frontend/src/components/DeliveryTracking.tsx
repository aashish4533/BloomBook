import { useState } from 'react';
import { Package, Truck, CheckCircle, MapPin, Clock, Phone, Mail, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DeliveryTrackingProps {
  orderId?: string | null;
  estimatedDelivery?: string;
  onClose?: () => void;
  onBack?: () => void;
}

export function DeliveryTracking({ orderId = 'ORD123456', estimatedDelivery = 'Jan 18, 2024', onClose, onBack }: DeliveryTrackingProps) {
  const [trackingSteps] = useState([
    {
      id: 1,
      title: 'Order Confirmed',
      description: 'Your order has been placed successfully',
      timestamp: '2024-01-15 10:30 AM',
      status: 'completed',
      icon: CheckCircle
    },
    {
      id: 2,
      title: 'Package Prepared',
      description: 'Seller is preparing your package',
      timestamp: '2024-01-15 02:45 PM',
      status: 'completed',
      icon: Package
    },
    {
      id: 3,
      title: 'Out for Delivery',
      description: 'Package is on the way to your location',
      timestamp: '2024-01-16 09:00 AM',
      status: 'active',
      icon: Truck,
      location: 'Distribution Center, Main Street'
    },
    {
      id: 4,
      title: 'Delivered',
      description: 'Package will be delivered to your address',
      timestamp: 'Expected: ' + estimatedDelivery,
      status: 'pending',
      icon: MapPin
    }
  ]);

  const [courierInfo] = useState({
    name: 'Express Logistics',
    phone: '+1 (555) 123-4567',
    email: 'support@expresslogistics.com',
    trackingNumber: 'EXP' + Math.random().toString(36).substr(2, 9).toUpperCase()
  });

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-500 hover:text-gray-700">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
            )}
            <h2 className="text-2xl font-semibold text-[#2C3E50]">Order Tracking</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1 text-gray-400" />
              Estimated Delivery: <span className="font-medium ml-1">{estimatedDelivery}</span>
            </div>
            <Button variant="outline" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
          {/* Tracking Timeline */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-[#2C3E50] text-xl mb-6">Shipping Timeline</h3>

            <div className="space-y-6">
              {trackingSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';
                const isPending = step.status === 'pending';

                return (
                  <div key={step.id} className="relative">
                    {/* Connector Line */}
                    {index < trackingSteps.length - 1 && (
                      <div
                        className={`absolute left-5 top-12 w-0.5 h-full ${isCompleted ? 'bg-[#C4A672]' : 'bg-gray-200'
                          }`}
                      />
                    )}

                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                            ? 'bg-[#C4A672] text-white'
                            : isActive
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`${isCompleted || isActive ? 'text-[#2C3E50]' : 'text-gray-400'
                            }`}>
                            {step.title}
                          </h4>
                          {isActive && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm mb-1 ${isCompleted || isActive ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {step.description}
                        </p>
                        <p className="text-xs text-gray-500">{step.timestamp}</p>

                        {step.location && isActive && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                            <MapPin className="w-4 h-4" />
                            <span>Current Location: {step.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Map Placeholder */}
          <Card className="p-6 mt-6">
            <h3 className="text-[#2C3E50] text-xl mb-4">Live Tracking Map</h3>
            <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '300px' }}>
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Map placeholder with route */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50" />

                {/* Route line */}
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d="M 50 250 Q 150 200, 250 150 T 450 50"
                    stroke="#C4A672"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                    fill="none"
                    className="animate-pulse"
                  />
                </svg>

                {/* Start marker */}
                <div className="absolute left-12 bottom-12 w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center shadow-lg">
                  <Package className="w-4 h-4 text-white" />
                </div>

                {/* Current position */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Truck className="w-5 h-5 text-white" />
                </div>

                {/* End marker */}
                <div className="absolute right-12 top-12 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-[#C4A672]" />
                    <p className="text-sm text-gray-600">Live tracking map</p>
                    <p className="text-xs text-gray-500">Updates every 30 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Courier Information */}
          <Card className="p-6">
            <h3 className="text-[#2C3E50] mb-4">Courier Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Courier Service</p>
                <p className="text-[#2C3E50]">{courierInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                <p className="text-[#2C3E50] font-mono text-sm">{courierInfo.trackingNumber}</p>
              </div>
              <div className="pt-4 border-t space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = `tel:${courierInfo.phone}`}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {courierInfo.phone}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = `mailto:${courierInfo.email}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-6">
            <h3 className="text-[#2C3E50] mb-4">Delivery Address</h3>
            <div className="space-y-2 text-sm">
              <p className="text-[#2C3E50]">John Doe</p>
              <p className="text-gray-600">123 Main Street, Apt 4B</p>
              <p className="text-gray-600">New York, NY 10001</p>
              <p className="text-gray-600">United States</p>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-[#2C3E50] mb-4">Need Help?</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-between">
                Report an Issue
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                Change Address
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                Delivery Instructions
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}