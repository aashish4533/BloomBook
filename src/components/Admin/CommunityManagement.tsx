import { useState } from 'react';
import { Search, Filter, Users, MessageCircle, Shield, Flag, CheckCircle, XCircle, Eye, Trash2, MoreVertical } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';

interface Community {
  id: string;
  name: string;
  admin: string;
  adminId: string;
  memberCount: number;
  postsCount: number;
  createdAt: Date;
  privacy: 'public' | 'private';
  status: 'active' | 'pending' | 'flagged';
  topic: string;
  reportCount: number;
}

const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Science Fiction Lovers',
    admin: 'Sarah Johnson',
    adminId: 'user1',
    memberCount: 1234,
    postsCount: 234,
    createdAt: new Date('2023-01-15'),
    privacy: 'public',
    status: 'active',
    topic: 'Fiction',
    reportCount: 0
  },
  {
    id: '2',
    name: 'Business Book Club',
    admin: 'Michael Chen',
    adminId: 'user2',
    memberCount: 856,
    postsCount: 156,
    createdAt: new Date('2023-05-20'),
    privacy: 'public',
    status: 'active',
    topic: 'Business',
    reportCount: 0
  },
  {
    id: '3',
    name: 'Fantasy Realm',
    admin: 'Emma Williams',
    adminId: 'user3',
    memberCount: 2103,
    postsCount: 567,
    createdAt: new Date('2023-08-10'),
    privacy: 'private',
    status: 'active',
    topic: 'Fantasy',
    reportCount: 0
  },
  {
    id: '4',
    name: 'Controversial Reads',
    admin: 'John Doe',
    adminId: 'user4',
    memberCount: 234,
    postsCount: 89,
    createdAt: new Date('2024-11-01'),
    privacy: 'public',
    status: 'flagged',
    topic: 'General',
    reportCount: 5
  },
  {
    id: '5',
    name: 'New Community Test',
    admin: 'Jane Smith',
    adminId: 'user5',
    memberCount: 12,
    postsCount: 3,
    createdAt: new Date('2024-11-14'),
    privacy: 'private',
    status: 'pending',
    topic: 'Education',
    reportCount: 0
  }
];

export function CommunityManagement() {
  const [communities, setCommunities] = useState(mockCommunities);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filteredCommunities = communities
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.admin.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesPrivacy = privacyFilter === 'all' || c.privacy === privacyFilter;
      return matchesSearch && matchesStatus && matchesPrivacy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'members':
          return b.memberCount - a.memberCount;
        case 'posts':
          return b.postsCount - a.postsCount;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleApprove = (id: string) => {
    setCommunities(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'active' as const } : c
      )
    );
    toast.success('Community approved');
  };

  const handleReject = (id: string) => {
    if (confirm('Are you sure you want to reject this community? It will be deleted.')) {
      setCommunities(prev => prev.filter(c => c.id !== id));
      toast.info('Community rejected and deleted');
    }
  };

  const handleFlag = (id: string) => {
    setCommunities(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === 'flagged' ? 'active' as const : 'flagged' as const }
          : c
      )
    );
    const community = communities.find(c => c.id === id);
    toast.success(community?.status === 'flagged' ? 'Community unflagged' : 'Community flagged for review');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this community? This action cannot be undone.')) {
      setCommunities(prev => prev.filter(c => c.id !== id));
      toast.success('Community deleted');
    }
  };

  const handleViewDetails = (id: string) => {
    toast.info(`Opening community details for ID: ${id}`);
    // In real app, this would navigate to community details
  };

  const handleViewAdminActions = (adminId: string) => {
    toast.info(`Viewing admin action history for: ${adminId}`);
    // In real app, this would show admin activity log
  };

  const getStatusBadge = (status: Community['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      flagged: 'bg-red-100 text-red-700 border-red-200'
    };
    const icons = {
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      pending: <Shield className="w-3 h-3 mr-1" />,
      flagged: <Flag className="w-3 h-3 mr-1" />
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: communities.length,
    active: communities.filter(c => c.status === 'active').length,
    pending: communities.filter(c => c.status === 'pending').length,
    flagged: communities.filter(c => c.status === 'flagged').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl text-gray-900 mb-2">Community Management</h2>
        <p className="text-gray-600">Monitor and manage all communities on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Communities</p>
              <p className="text-2xl text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-2xl text-red-600 mt-1">{stats.flagged}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search communities or admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
          <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by privacy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Privacy</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="members">Most Members</SelectItem>
              <SelectItem value="posts">Most Posts</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Communities Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm text-gray-700">Community</th>
                <th className="text-left p-4 text-sm text-gray-700">Admin</th>
                <th className="text-left p-4 text-sm text-gray-700">Stats</th>
                <th className="text-left p-4 text-sm text-gray-700">Privacy</th>
                <th className="text-left p-4 text-sm text-gray-700">Status</th>
                <th className="text-left p-4 text-sm text-gray-700">Created</th>
                <th className="text-left p-4 text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommunities.map((community) => (
                <tr key={community.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="text-gray-900">{community.name}</div>
                      <div className="text-sm text-gray-500">{community.topic}</div>
                      {community.reportCount > 0 && (
                        <Badge variant="outline" className="mt-1 bg-red-50 text-red-600 border-red-200">
                          {community.reportCount} reports
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900">{community.admin}</div>
                    <button
                      onClick={() => handleViewAdminActions(community.adminId)}
                      className="text-sm text-[#C4A672] hover:underline"
                    >
                      View actions
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {community.memberCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {community.postsCount}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">
                      {community.privacy === 'public' ? '🌐 Public' : '🔒 Private'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(community.status)}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {community.createdAt.toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {community.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(community.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(community.id)}
                            className="text-red-600 border-red-200"
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(community.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlag(community.id)}
                            className={
                              community.status === 'flagged'
                                ? 'text-green-600 border-green-200'
                                : 'text-yellow-600 border-yellow-200'
                            }
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(community.id)}
                            className="text-red-600 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No communities found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredCommunities.length} of {communities.length} communities
      </div>
    </div>
  );
}
