import { Phone, X, Clock, Mail, MessageCircle, Video, Headphones } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface CallSupportProps {
  onClose: () => void;
}

export function CallSupport({ onClose }: CallSupportProps) {
  const supportOptions = [
    {
      id: 'phone',
      title: 'Call Us',
      description: 'Speak with our support team',
      phone: '+1 (800) 555-BOOK',
      hours: '24/7 Available',
      icon: Phone,
      color: 'bg-green-500'
    },
    {
      id: 'voip',
      title: 'In-App Call',
      description: 'Free VoIP call via app',
      action: 'Start VoIP Call',
      hours: 'Mon-Fri: 9AM-6PM EST',
      icon: Headphones,
      color: 'bg-blue-500'
    },
    {
      id: 'video',
      title: 'Video Support',
      description: 'Screen share for technical help',
      action: 'Schedule Video Call',
      hours: 'Mon-Fri: 10AM-5PM EST',
      icon: Video,
      color: 'bg-purple-500'
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with support agents',
      action: 'Open Live Chat',
      hours: '24/7 Available',
      icon: MessageCircle,
      color: 'bg-[#C4A672]'
    }
  ];

  const handlePhoneCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  };

  const handleVoIPCall = () => {
    // Placeholder for VoIP functionality
    alert('Connecting to support via VoIP...\n\nThis would initiate an in-app voice call using WebRTC or similar technology.');
  };

  const handleVideoCall = () => {
    // Placeholder for video call scheduling
    alert('Video Support\n\nYou would be redirected to schedule a video call with our technical support team.');
  };

  const handleLiveChat = () => {
    onClose();
    // Would open live chat widget
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white p-6 sticky top-0 z-10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl mb-1">Contact Support</h2>
              <p className="text-white/90 text-sm">We're here to help you</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Support Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-green-800">Support team is online</p>
              <p className="text-xs text-green-600">Average response time: 2 minutes</p>
            </div>
          </div>

          {/* Support Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {supportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#C4A672]"
                  onClick={() => {
                    if (option.id === 'phone' && option.phone) {
                      handlePhoneCall(option.phone);
                    } else if (option.id === 'voip') {
                      handleVoIPCall();
                    } else if (option.id === 'video') {
                      handleVideoCall();
                    } else if (option.id === 'chat') {
                      handleLiveChat();
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#2C3E50] mb-1">{option.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{option.hours}</span>
                      </div>
                      {option.phone && (
                        <p className="text-[#C4A672] mt-2">{option.phone}</p>
                      )}
                      {option.action && (
                        <Badge variant="outline" className="mt-2">
                          {option.action}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Email Support */}
          <Card className="p-6 bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#2C3E50] mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 mb-3">
                  For non-urgent inquiries or detailed questions
                </p>
                <a
                  href="mailto:support@bookora.com"
                  className="text-[#C4A672] hover:underline text-sm"
                >
                  support@bookora.com
                </a>
                <p className="text-xs text-gray-500 mt-2">Response within 24 hours</p>
              </div>
            </div>
          </Card>

          {/* FAQs Link */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Looking for quick answers? Check our FAQs first
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              View FAQs
            </Button>
          </div>

          {/* Emergency Contact */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-[#2C3E50] mb-3">Emergency Contact</h4>
            <p className="text-sm text-gray-600 mb-2">
              For urgent security or account issues:
            </p>
            <Button
              onClick={() => handlePhoneCall('+1-800-555-9911')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              Emergency: +1 (800) 555-9911
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
