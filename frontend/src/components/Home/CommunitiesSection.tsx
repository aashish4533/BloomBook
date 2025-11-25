// Updated src/components/Home/CommunitiesSection.tsx
import { useState, useEffect } from 'react';
import { Users, Lock, Globe, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, runTransaction, query, limit, getDoc } from 'firebase/firestore';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  admin: string;
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
    const fetchCommunities = async () => {
      const q = query(collection(db, 'communities'), limit(4));  // Top 4
      const snapshot = await getDocs(q);
      const data = await Promise.all(snapshot.docs.map(async (d) => {
        const comm = { id: d.id, ...d.data() } as Community;
        if (user) {
          const memberRef = doc(db, `communities/${d.id}/members/${user.uid}`);
          const memberSnap = await getDoc(memberRef);  // Use getDoc for single doc
          comm.isMember = memberSnap.exists();
        } else {
          comm.isMember = false;
        }
        return comm;
      }));
      setCommunities(data);
    };
    fetchCommunities();
  }, [user]);

  const handleJoin = async (communityId: string, privacy: 'public' | 'private') => {
    if (!isLoggedIn || !user) {
      toast.error('Please login to join communities');
      return;
    }

    const commRef = doc(db, 'communities', communityId);
    const memberRef = doc(commRef, 'members', user.uid);

    if (privacy === 'private') {
      // For private, perhaps add to 'requests' subcollection (TODO: implement)
      await setDoc(memberRef, { requested: true, date: new Date() });
      toast.success('Join request sent! Waiting for admin approval.');
    } else {
      try {
        await runTransaction(db, async (transaction) => {
          const commDoc = await transaction.get(commRef);
          if (!commDoc.exists()) throw new Error('Community not found');
          transaction.update(commRef, { memberCount: commDoc.data().memberCount + 1 });
          transaction.set(memberRef, { joined: new Date() });
        });
        setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c));
        toast.success('Successfully joined the community!');
      } catch (err) {
        toast.error('Failed to join');
      }
    }
  };

  const handleLeave = async (communityId: string) => {
    if (!user) return;

    const commRef = doc(db, 'communities', communityId);
    const memberRef = doc(commRef, 'members', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const commDoc = await transaction.get(commRef);
        if (!commDoc.exists()) throw new Error('Community not found');
        transaction.update(commRef, { memberCount: commDoc.data().memberCount - 1 });
        transaction.delete(memberRef);
      });
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, isMember: false, memberCount: c.memberCount - 1 } : c));
      toast.info('You left the community');
    } catch (err) {
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