import { useState, useEffect } from 'react';
import { Search, Filter, Bell, Plus, Edit2, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AnnouncementForm } from './Admin/AnnouncementForm';
import { toast } from 'sonner';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'promo' | 'update';
  image?: string;
  date: Date;
  published: boolean;
  views: number;
}



interface AnnouncementsPageProps {
  isAdmin?: boolean;
  onBack?: () => void;
}

export function AnnouncementsPage({ isAdmin = false, onBack }: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    // Real-time listener for announcements
    const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      })) as Announcement[];
      setAnnouncements(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAnnouncements = announcements
    .filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !typeFilter || typeFilter === 'all' || a.type === typeFilter;
      return matchesSearch && matchesType;
    });

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        toast.success('Announcement deleted');
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error('Failed to delete announcement');
      }
    }
  };

  const handleSave = (data: Omit<Announcement, 'id' | 'views'>) => {
    // Logic handled inside AnnouncementForm and onSnapshot updates the list
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const handleTogglePublish = async (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;

    try {
      await updateDoc(doc(db, 'announcements', id), {
        published: !announcement.published
      });
      toast.success(announcement.published ? 'Announcement unpublished' : 'Announcement published');
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error('Failed to update status');
    }
  };

  const getTypeBadge = (type: Announcement['type']) => {
    const styles = {
      info: 'bg-blue-100 text-blue-700 border-blue-200',
      promo: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      update: 'bg-green-100 text-green-700 border-green-200'
    };
    return styles[type];
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'promo':
        return '🎁';
      case 'update':
        return '✨';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 shadow-card">
        <div className="max-w-7xl mx-auto px-4">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/10 mb-4 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl mb-2">📢 Announcements</h1>
              <p className="text-white/90">Stay updated with the latest news and offers from Book Bloom</p>
            </div>
            {isAdmin && (
              <Button
                onClick={handleCreate}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 transition-smooth btn-scale shadow-subtle"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Announcement
              </Button>
            )}
          </div>

          {/* Enhanced Search & Filter */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Type to search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 bg-white text-gray-900 border-2 border-white/20 focus:border-white focus-glow shadow-subtle"
              />
              {searchQuery && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {filteredAnnouncements.length} results
                </div>
              )}
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={`w-48 h-12 bg-white shadow-subtle ${!typeFilter ? 'text-gray-400' : 'text-gray-900'}`}>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">ℹ️ Info</SelectItem>
                <SelectItem value="promo">🎁 Promo</SelectItem>
                <SelectItem value="update">✨ Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-gray-600">
              {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''} found
            </div>

            <div className="space-y-6">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  {announcement.image && (
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={announcement.image}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                      />
                      {!announcement.published && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-yellow-500 text-white">Draft</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={getTypeBadge(announcement.type)}>
                            {getTypeIcon(announcement.type)} {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {announcement.date.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {isAdmin && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {announcement.views.toLocaleString()} views
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl text-[#2C3E50] mb-3">{announcement.title}</h2>
                        <p className="text-gray-700 leading-relaxed">{announcement.content}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(announcement.id)}
                            className="text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(announcement.id)}
                        >
                          {announcement.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <span className="text-sm text-gray-500">
                          Status: {announcement.published ? (
                            <span className="text-green-600">Published</span>
                          ) : (
                            <span className="text-yellow-600">Draft</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredAnnouncements.length === 0 && (
                <div className="text-center py-16">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-600 mb-2">No announcements found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || typeFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No announcements have been posted yet'}
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={handleCreate}
                      className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Announcement
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Announcement Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={() => {
            setShowForm(false);
            setEditingAnnouncement(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
