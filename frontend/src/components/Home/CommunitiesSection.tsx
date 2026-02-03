// Updated src/components/Home/CommunitiesSection.tsx
import { useState, useEffect } from 'react';
import { Users, Lock, Globe, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { collection, doc, setDoc, deleteDoc, query, limit, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  admin: string;
  adminName?: string; // Add optional adminName
  privacy: 'public' | 'private';
  topic: string;
  image: string;
  isMember: boolean;  // Determined client-side
}

interface CommunitiesSectionProps {
  onNavigateToCommunities: () => void;
  isLoggedIn: boolean;
}

export function CommunitiesSection({ onNavigateToCommunities, isLoggedIn }: CommunitiesSectionProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    // Real-time listener for top communities
    const q = query(collection(db, 'communities'), limit(4));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => {
        const dData = d.data();
        const members = dData.members || [];

        let isMember = false;
        if (user) {
          // Check if user is in members array
          isMember = members.includes(user.uid);
        }

        return {
          id: d.id,
          ...dData,
          // Map adminName to admin if admin is missing or generic
          admin: dData.adminName || dData.admin || 'Unknown',
          image: dData.image || dData.coverImage || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80',
          isMember
        } as Community;
      });
      setCommunities(data);
    }, (error) => {
      console.error("Error fetching communities:", error);
      // toast.error("Failed to load communities"); // Suppress to avoid spam on mounting if error
    });

    return () => unsubscribe();
  }, [user]);

  const handleJoin = async (communityId: string, privacy: 'public' | 'private') => {
    if (!isLoggedIn || !user) {
      toast.error('Please login to join communities');
      return;
    }

    const commRef = doc(db, 'communities', communityId);
    // Subcollection ref (Optional for list view but good for integrity)
    const memberRef = doc(commRef, 'members', user.uid);

    if (privacy === 'private') {
      try {
        await updateDoc(commRef, {
          pending: arrayUnion(user.uid)
        });
        // Also add to pending subcollection if needed (omitted here for brevity/alignment with Browse)
        await setDoc(doc(commRef, 'pending', user.uid), {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          avatar: user.photoURL || 'CU',
          joinedAt: new Date().toISOString()
        });

        toast.success('Join request sent! Waiting for admin approval.');
      } catch (err) {
        toast.error('Failed to send request');
      }
    } else {
      try {
        // Update Array and Count
        await updateDoc(commRef, {
          members: arrayUnion(user.uid),
          memberCount: increment(1)
        });

        // Update Subcollection
        await setDoc(memberRef, {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          avatar: user.photoURL || 'CU',
          role: 'member',
          joinedAt: new Date().toISOString()
        });

        toast.success('Successfully joined the community!');
      } catch (err) {
        console.error(err);
        toast.error('Failed to join');
      }
    }
  };

  const handleLeave = async (communityId: string) => {
    if (!user) return;

    const commRef = doc(db, 'communities', communityId);
    const memberRef = doc(commRef, 'members', user.uid);

    try {
      // Remove from Array and Count
      await updateDoc(commRef, {
        members: arrayRemove(user.uid),
        memberCount: increment(-1)
      });

      // Remove from Subcollection
      await deleteDoc(memberRef);

      toast.info('You left the community');
    } catch (err) {
      console.error(err);
      toast.error('Failed to leave');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {communities.map((community) => (
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