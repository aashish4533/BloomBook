import { useState } from 'react';
import { GraduationCap, Video, Calendar, Clock, Star, Users, BookOpen, Search, Filter, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TuitionHubProps {
  onBack: () => void;
  isLoggedIn: boolean;
}

export function TuitionHub({ onBack, isLoggedIn }: TuitionHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const tutors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      specialization: 'Calculus & Algebra',
      rating: 4.9,
      reviews: 342,
      students: 1200,
      hourlyRate: 45,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      verified: true,
      experience: '10+ years',
      availability: 'Available'
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      subject: 'Physics',
      specialization: 'Quantum Mechanics & Thermodynamics',
      rating: 4.8,
      reviews: 287,
      students: 890,
      hourlyRate: 50,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      verified: true,
      experience: '15+ years',
      availability: 'Available'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      subject: 'English Literature',
      specialization: 'Essay Writing & Literary Analysis',
      rating: 4.7,
      reviews: 198,
      students: 650,
      hourlyRate: 35,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      verified: true,
      experience: '7+ years',
      availability: 'Limited Slots'
    },
    {
      id: '4',
      name: 'James Wilson',
      subject: 'Computer Science',
      specialization: 'Programming & Data Structures',
      rating: 4.9,
      reviews: 421,
      students: 1500,
      hourlyRate: 55,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      verified: true,
      experience: '12+ years',
      availability: 'Available'
    },
    {
      id: '5',
      name: 'Dr. Lisa Anderson',
      subject: 'Chemistry',
      specialization: 'Organic & Inorganic Chemistry',
      rating: 4.8,
      reviews: 267,
      students: 780,
      hourlyRate: 48,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      verified: true,
      experience: '9+ years',
      availability: 'Available'
    },
    {
      id: '6',
      name: 'David Kim',
      subject: 'Economics',
      specialization: 'Microeconomics & Macroeconomics',
      rating: 4.6,
      reviews: 156,
      students: 520,
      hourlyRate: 40,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      verified: true,
      experience: '6+ years',
      availability: 'Available'
    },
  ];

  const upcomingSessions = [
    {
      id: 's1',
      tutor: 'Dr. Sarah Johnson',
      subject: 'Calculus II',
      date: 'Today',
      time: '3:00 PM - 4:00 PM',
      type: 'Live Session'
    },
    {
      id: 's2',
      tutor: 'Prof. Michael Chen',
      subject: 'Quantum Mechanics',
      date: 'Tomorrow',
      time: '2:00 PM - 3:30 PM',
      type: 'Live Session'
    },
  ];

  const categories = [
    { id: 'all', label: 'All Subjects', icon: BookOpen },
    { id: 'math', label: 'Mathematics', icon: GraduationCap },
    { id: 'science', label: 'Science', icon: BookOpen },
    { id: 'english', label: 'English', icon: BookOpen },
    { id: 'cs', label: 'Computer Science', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl mb-2">Online Tuition Hub</h1>
              <p className="text-white/90">Connect with expert tutors for personalized learning</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by subject, tutor name, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-0"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center">
            <GraduationCap className="w-8 h-8 mx-auto mb-2 text-[#C4A672]" />
            <div className="text-2xl text-[#2C3E50] mb-1">500+</div>
            <div className="text-sm text-gray-600">Expert Tutors</div>
          </Card>
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-[#C4A672]" />
            <div className="text-2xl text-[#2C3E50] mb-1">10K+</div>
            <div className="text-sm text-gray-600">Active Students</div>
          </Card>
          <Card className="p-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#C4A672]" />
            <div className="text-2xl text-[#2C3E50] mb-1">50+</div>
            <div className="text-sm text-gray-600">Subjects</div>
          </Card>
          <Card className="p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-[#C4A672]" />
            <div className="text-2xl text-[#2C3E50] mb-1">4.8</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </Card>
        </div>

        {/* Upcoming Sessions (Only for logged in users) */}
        {isLoggedIn && upcomingSessions.length > 0 && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-[#C4A672]/10 to-transparent">
            <h3 className="text-[#2C3E50] text-xl mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#C4A672]" />
              Your Upcoming Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-[#C4A672] rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#2C3E50]">{session.subject}</h4>
                    <p className="text-sm text-gray-600">with {session.tutor}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.date} • {session.time}
                    </p>
                  </div>
                  <Button size="sm" className="bg-[#C4A672] hover:bg-[#8B7355]">
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                className={activeCategory === category.id ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Tutors Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#2C3E50] text-2xl">Available Tutors ({tutors.length})</h2>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <Card key={tutor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Tutor Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <ImageWithFallback
                        src={tutor.avatar}
                        alt={tutor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {tutor.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#2C3E50]">{tutor.name}</h3>
                      <p className="text-sm text-gray-600">{tutor.subject}</p>
                      <Badge
                        variant={tutor.availability === 'Available' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {tutor.availability}
                      </Badge>
                    </div>
                  </div>

                  {/* Specialization */}
                  <p className="text-sm text-gray-600 mb-4">{tutor.specialization}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        <span className="text-sm text-[#2C3E50]">{tutor.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500">{tutor.reviews} reviews</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-[#C4A672]" />
                        <span className="text-sm text-[#2C3E50]">{tutor.students}</span>
                      </div>
                      <p className="text-xs text-gray-500">students</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-[#C4A672]" />
                        <span className="text-sm text-[#2C3E50]">{tutor.experience}</span>
                      </div>
                      <p className="text-xs text-gray-500">experience</p>
                    </div>
                  </div>

                  {/* Pricing & Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Starting at</p>
                      <p className="text-[#C4A672] text-xl">${tutor.hourlyRate}/hr</p>
                    </div>
                    <Button
                      className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                      disabled={!isLoggedIn}
                    >
                      {isLoggedIn ? 'Book Session' : 'Login to Book'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16">
          <h2 className="text-[#2C3E50] text-2xl text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h3 className="text-[#2C3E50] mb-2">1. Find Your Tutor</h3>
              <p className="text-gray-600 text-sm">
                Browse through our verified tutors and find the perfect match for your learning needs
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h3 className="text-[#2C3E50] mb-2">2. Book a Session</h3>
              <p className="text-gray-600 text-sm">
                Schedule a convenient time slot and choose between one-on-one or group sessions
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h3 className="text-[#2C3E50] mb-2">3. Start Learning</h3>
              <p className="text-gray-600 text-sm">
                Join live video sessions and get personalized guidance from expert tutors
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
