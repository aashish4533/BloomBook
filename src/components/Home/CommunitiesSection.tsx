import { useState } from 'react';
import { Users, Lock, Globe, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  admin: string;
  privacy: 'public' | 'private';
  topic: string;
  image: string;
  isMember: boolean;
}

const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Science Fiction Lovers',
    description: 'Discuss classic and modern sci-fi books, from Asimov to Liu Cixin',
    memberCount: 1234,
    admin: 'Sarah Johnson',
    privacy: 'public',
    topic: 'Fiction',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400',
    isMember: false
  },
  {
    id: '2',
    name: 'Business Book Club',
    description: 'Professional development through reading and discussion',
    memberCount: 856,
    admin: 'Michael Chen',
    privacy: 'public',
    topic: 'Business',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    isMember: true
  },
  {
    id: '3',
    name: 'Fantasy Realm',
    description: 'Epic tales, magical worlds, and dragon adventures await',
    memberCount: 2103,
    admin: 'Emma Williams',
    privacy: 'private',
    topic: 'Fantasy',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    isMember: false
  },
  {
    id: '4',
    name: 'Academic Exchange',
    description: 'Share textbooks, notes, and study resources',
    memberCount: 567,
    admin: 'David Park',
    privacy: 'public',
    topic: 'Education',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    isMember: false
  }
];

interface CommunitiesSectionProps {
  onNavigateToCommunities: () => void;
  isLoggedIn: boolean;
}

export function CommunitiesSection({ onNavigateToCommunities, isLoggedIn }: CommunitiesSectionProps) {
  const [communities, setCommunities] = useState(mockCommunities);

  const handleJoin = (communityId: string, privacy: 'public' | 'private') => {
    if (!isLoggedIn) {
      toast.error('Please login to join communities');
      return;
    }

    if (privacy === 'private') {
      toast.success('Join request sent! Waiting for admin approval.');
    } else {
      setCommunities(prev =>
        prev.map(c =>
          c.id === communityId
            ? { ...c, isMember: true, memberCount: c.memberCount + 1 }
            : c
        )
      );
      toast.success('Successfully joined the community!');
    }
  };

  const handleLeave = (communityId: string) => {
    setCommunities(prev =>
      prev.map(c =>
        c.id === communityId
          ? { ...c, isMember: false, memberCount: c.memberCount - 1 }
          : c
      )
    );
    toast.info('You left the community');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {communities.slice(0, 4).map((community) => (
        <div
          key={community.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
        >
          {/* Community Image */}
          <div className="relative h-32 bg-gradient-to-br from-[#C4A672] to-[#8B7355] overflow-hidden">
            <img
              src={community.image}
              alt={community.name}
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 text-gray-700 border-0">
                {community.privacy === 'public' ? (
                  <><Globe className="w-3 h-3 mr-1" /> Public</>
                ) : (
                  <><Lock className="w-3 h-3 mr-1" /> Private</>
                )}
              </Badge>
            </div>
          </div>

          {/* Community Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[#2C3E50] group-hover:text-[#C4A672] transition-colors line-clamp-1">
                {community.name}
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
              {community.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{community.memberCount.toLocaleString()}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {community.topic}
              </Badge>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              Admin: {community.admin}
            </div>

            {/* Actions */}
            {community.isMember ? (
              <div className="space-y-2">
                <Button
                  onClick={() => onNavigateToCommunities()}
                  className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  View Community
                </Button>
                <Button
                  onClick={() => handleLeave(community.id)}
                  variant="outline"
                  className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  size="sm"
                >
                  Leave
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => handleJoin(community.id, community.privacy)}
                className="w-full bg-[#2C3E50] hover:bg-[#1a252f] text-white"
                size="sm"
              >
                {community.privacy === 'private' ? 'Request to Join' : 'Join Community'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
