import { BookOpen, Users, Heart, Shield, TrendingUp, Award, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { CallSupport } from './CallSupport';

interface AboutPageProps {
  onBack: () => void;
  onNavigateToCommunities?: () => void;
}

export function AboutPage({ onBack, onNavigateToCommunities }: AboutPageProps) {
  const [showCallSupport, setShowCallSupport] = useState(false);
  
  const stats = [
    { label: 'Active Users', value: '50,000+', icon: Users },
    { label: 'Books Listed', value: '200,000+', icon: BookOpen },
    { label: 'Communities', value: '500+', icon: Heart },
    { label: 'Transactions', value: '1M+', icon: TrendingUp },
  ];

  const values = [
    {
      icon: BookOpen,
      title: 'Accessibility',
      description: 'We believe everyone should have access to books, whether through buying, renting, or community sharing.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building connections between book lovers through vibrant communities and meaningful conversations.',
    },
    {
      icon: Shield,
      title: 'Trust',
      description: 'Safe and secure transactions with verified users and transparent communication channels.',
    },
    {
      icon: Award,
      title: 'Quality',
      description: 'Curated marketplace ensuring high-quality books and authentic community interactions.',
    },
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'Founder & CEO', bio: 'Book enthusiast with 15 years in tech' },
    { name: 'Michael Chen', role: 'Head of Community', bio: 'Building connections through literature' },
    { name: 'Emily Rodriguez', role: 'Lead Developer', bio: 'Creating seamless book experiences' },
    { name: 'David Kim', role: 'Operations Manager', bio: 'Ensuring smooth transactions daily' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-20 relative">
          <button
            onClick={onBack}
            className="mb-6 text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-5xl md:text-6xl mb-6">About BookOra</h1>
          <p className="text-xl text-white/90 max-w-3xl mb-8">
            Connecting readers, building communities, and making books accessible to everyone through our innovative marketplace platform.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={onNavigateToCommunities}
              className="bg-white text-[#C4A672] hover:bg-white/90"
            >
              Join Communities
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/20"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl text-[#2C3E50] mb-2">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-6 bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl text-[#2C3E50] mb-8 text-center">Our Story</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg">
              BookOra was born from a simple idea: books should be accessible to everyone, and readers should be able to connect with each other. In 2023, our founder Sarah Johnson recognized that many people had books sitting on shelves, while others were searching for affordable ways to access literature.
            </p>
            <p className="text-lg">
              We created BookOra to solve this problem. Our platform enables users to buy, sell, and rent books while fostering vibrant communities where readers can discuss their favorite titles, share recommendations, and build lasting connections.
            </p>
            <p className="text-lg">
              Today, BookOra has grown into a thriving marketplace with over 50,000 active users, 200,000 books listed, and 500+ communities dedicated to every genre and interest imaginable. We're proud to have facilitated over 1 million transactions, making literature more accessible one book at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-[#2C3E50] mb-4 text-center">Our Values</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            The principles that guide everything we do at BookOra
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[#F5F1E8] to-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-[#C4A672]/20"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl text-[#2C3E50] mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-[#2C3E50] mb-4 text-center">Meet Our Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Passionate book lovers dedicated to making literature accessible
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-white">{member.name[0]}</span>
                </div>
                <h3 className="text-xl text-[#2C3E50] mb-2">{member.name}</h3>
                <p className="text-[#C4A672] mb-3">{member.role}</p>
                <p className="text-sm text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl text-[#2C3E50] mb-4 text-center">Get In Touch</h2>
          <p className="text-center text-gray-600 mb-12">
            Have questions? We'd love to hear from you.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center p-6 bg-[#F5F1E8] rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-[#2C3E50] mb-2">Email</h3>
              <p className="text-gray-600">support@bookora.com</p>
            </div>
            <div className="text-center p-6 bg-[#F5F1E8] rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-[#2C3E50] mb-2">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
            <div className="text-center p-6 bg-[#F5F1E8] rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-[#2C3E50] mb-2">Location</h3>
              <p className="text-gray-600">San Francisco, CA</p>
            </div>
          </div>
          
          {/* Call Support Button */}
          <div className="text-center">
            <Button
              onClick={() => setShowCallSupport(true)}
              className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8 py-6 text-lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of readers in our vibrant book-loving community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={onNavigateToCommunities}
              className="bg-white text-[#C4A672] hover:bg-white/90 px-8 py-6 text-lg"
            >
              Explore Communities
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="border-white text-white hover:bg-white/20 px-8 py-6 text-lg"
            >
              Browse Books
            </Button>
          </div>
        </div>
      </section>
      
      {/* Call Support Modal */}
      {showCallSupport && <CallSupport onClose={() => setShowCallSupport(false)} />}
    </div>
  );
}