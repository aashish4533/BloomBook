import { useState } from 'react';
import {
  GraduationCap, Users, Star, Trash2, CheckCircle, XCircle,
  Search, Filter, BookOpen, Clock, DollarSign, MessageSquare,
  ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection, doc, deleteDoc, updateDoc
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '../ui/dialog';

interface Tutor {
  id: string;
  name: string;
  subject: string;
  specialization: string;
  rating: number;
  reviews: number;
  students: number;
  hourlyRate: number;
  avatar: string;
  verified: boolean;
  experience: string;
  availability: string;
  availableHours: string;
  userId: string;
  bio?: string;
  certificate?: string;
  createdAt?: any;
}

interface TuitionRequest {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  budget: string;
  createdAt?: any;
}

type ActiveTab = 'overview' | 'tutors' | 'requests';

export function TuitionManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  // Live Firestore data
  const [tutorsSnap, tutorsLoading] = useCollection(collection(db, 'tutors'));
  const [requestsSnap, requestsLoading] = useCollection(collection(db, 'tuition_requests'));

  const tutors: Tutor[] = tutorsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as Tutor)) || [];
  const requests: TuitionRequest[] = requestsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as TuitionRequest)) || [];

  // ── Computed stats ──────────────────────────────────────────────────────────
  const verifiedCount = tutors.filter(t => t.verified).length;
  const unverifiedCount = tutors.length - verifiedCount;
  const avgRating = tutors.length
    ? (tutors.reduce((s, t) => s + (t.rating || 0), 0) / tutors.length).toFixed(1)
    : '—';
  const totalStudents = tutors.reduce((s, t) => s + (t.students || 0), 0);

  // ── Filtered tutors ─────────────────────────────────────────────────────────
  const filteredTutors = tutors.filter(t => {
    const matchesSearch =
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterVerified === 'all' ||
      (filterVerified === 'verified' && t.verified) ||
      (filterVerified === 'unverified' && !t.verified);
    return matchesSearch && matchesFilter;
  });

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleVerifyTutor = async (tutor: Tutor) => {
    try {
      await updateDoc(doc(db, 'tutors', tutor.id), { verified: !tutor.verified });
      toast.success(tutor.verified ? `${tutor.name} unverified` : `${tutor.name} verified ✓`);
    } catch {
      toast.error('Failed to update verification status');
    }
  };

  const handleDeleteTutor = async (tutor: Tutor) => {
    if (!window.confirm(`Remove tutor profile for ${tutor.name}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'tutors', tutor.id));
      toast.success('Tutor profile removed');
      if (selectedTutor?.id === tutor.id) setSelectedTutor(null);
    } catch {
      toast.error('Failed to remove tutor');
    }
  };

  const handleDeleteRequest = async (req: TuitionRequest) => {
    if (!window.confirm('Delete this tuition request?')) return;
    try {
      await deleteDoc(doc(db, 'tuition_requests', req.id));
      toast.success('Request deleted');
    } catch {
      toast.error('Failed to delete request');
    }
  };

  // ── Tab buttons ─────────────────────────────────────────────────────────────
  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: GraduationCap },
    { id: 'tutors', label: `Tutors (${tutors.length})`, icon: Users },
    { id: 'requests', label: `Requests (${requests.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2C3E50] flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#C4A672]" />
            Tuition Hub Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage tutors, student requests and platform activity
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#C4A672] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tutors', value: tutors.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Verified Tutors', value: verifiedCount, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Pending Verification', value: unverifiedCount, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Open Requests', value: requests.length, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#2C3E50]">{stat.value}</p>
                </Card>
              );
            })}
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Tutor Rating</p>
                <p className="text-2xl font-bold text-[#2C3E50]">{avgRating}</p>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#C4A672]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#C4A672]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Students Served</p>
                <p className="text-2xl font-bold text-[#2C3E50]">{totalStudents.toLocaleString()}</p>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Hourly Rate</p>
                <p className="text-2xl font-bold text-[#2C3E50]">
                  {tutors.length
                    ? `Rs. ${Math.round(tutors.reduce((s, t) => s + (t.hourlyRate || 0), 0) / tutors.length)}`
                    : '—'}
                </p>
              </div>
            </Card>
          </div>

          {/* Pending verification list */}
          {unverifiedCount > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-[#2C3E50] mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Tutors Awaiting Verification ({unverifiedCount})
              </h3>
              <div className="space-y-3">
                {tutors.filter(t => !t.verified).map(tutor => (
                  <div key={tutor.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {tutor.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-[#2C3E50] text-sm">{tutor.name}</p>
                        <p className="text-xs text-gray-500">{tutor.subject} · Rs. {tutor.hourlyRate}/hr</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                        onClick={() => handleVerifyTutor(tutor)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 h-8 text-xs"
                        onClick={() => handleDeleteTutor(tutor)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── TUTORS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'tutors' && (
        <div className="space-y-4">
          {/* Search + filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or subject…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'verified', 'unverified'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filterVerified === f ? 'default' : 'outline'}
                  className={filterVerified === f ? 'bg-[#C4A672] hover:bg-[#8B7355] text-white' : ''}
                  onClick={() => setFilterVerified(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {tutorsLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading tutors…
            </div>
          )}

          {!tutorsLoading && filteredTutors.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tutors found</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTutors.map(tutor => (
              <Card key={tutor.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {tutor.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    {tutor.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[#2C3E50] truncate">{tutor.name}</h3>
                        <p className="text-sm text-gray-500">{tutor.subject}</p>
                      </div>
                      <Badge
                        variant={tutor.verified ? 'default' : 'secondary'}
                        className={tutor.verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}
                      >
                        {tutor.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{tutor.specialization}</p>

                    {/* Mini stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {tutor.rating || '0'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#C4A672]" />
                        {tutor.students || 0} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C4A672]" />
                        {tutor.experience}
                      </span>
                      <span className="font-semibold text-[#C4A672]">
                        Rs. {tutor.hourlyRate}/hr
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => setSelectedTutor(tutor)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className={`text-xs h-7 ${tutor.verified ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
                        onClick={() => handleVerifyTutor(tutor)}
                      >
                        {tutor.verified ? (
                          <><XCircle className="w-3 h-3 mr-1" />Unverify</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" />Verify</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteTutor(tutor)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── REQUESTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search requests…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {requestsLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading requests…
            </div>
          )}

          {!requestsLoading && requests.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tuition requests yet</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests
              .filter(r =>
                r.subject?.toLowerCase().includes(search.toLowerCase()) ||
                r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
                r.topic?.toLowerCase().includes(search.toLowerCase())
              )
              .map(req => (
                <Card key={req.id} className="p-4 border-l-4 border-l-[#C4A672]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="outline" className="mb-2">{req.subject}</Badge>
                      <h3 className="font-medium text-[#2C3E50] text-sm leading-snug">{req.topic}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteRequest(req)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium text-gray-700">{req.studentName}</span>
                    </p>
                    {req.gradeLevel && (
                      <p className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Grade: {req.gradeLevel}
                      </p>
                    )}
                    {req.budget && (
                      <p className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#C4A672]" />
                        <span className="font-semibold text-[#C4A672]">Budget: {req.budget}</span>
                      </p>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ─── TUTOR DETAIL DIALOG ──────────────────────────────────────────── */}
      <Dialog open={!!selectedTutor} onOpenChange={open => !open && setSelectedTutor(null)}>
        <DialogContent className="max-w-lg">
          {selectedTutor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedTutor.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p>{selectedTutor.name}</p>
                    <p className="text-sm text-gray-500 font-normal">{selectedTutor.subject}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Full tutor profile details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Rating', value: `${selectedTutor.rating || 0} ⭐`, },
                    { label: 'Students', value: selectedTutor.students || 0 },
                    { label: 'Experience', value: selectedTutor.experience || '—' },
                    { label: 'Hourly Rate', value: `Rs. ${selectedTutor.hourlyRate}` },
                    { label: 'Availability', value: selectedTutor.availability || '—' },
                    { label: 'Status', value: selectedTutor.verified ? '✅ Verified' : '⏳ Pending' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className="font-medium text-[#2C3E50] text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                {selectedTutor.specialization && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Specialization</p>
                    <p className="text-sm text-[#2C3E50]">{selectedTutor.specialization}</p>
                  </div>
                )}

                {selectedTutor.bio && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bio</p>
                    <p className="text-sm text-[#2C3E50]">{selectedTutor.bio}</p>
                  </div>
                )}

                {selectedTutor.availableHours && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Available Hours</p>
                    <p className="text-sm text-[#2C3E50]">{selectedTutor.availableHours}</p>
                  </div>
                )}

                {selectedTutor.certificate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Certificate</p>
                    <a
                      href={selectedTutor.certificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#C4A672] hover:underline"
                    >
                      View Certificate ↗
                    </a>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    className={`flex-1 ${selectedTutor.verified ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    onClick={() => { handleVerifyTutor(selectedTutor); setSelectedTutor(null); }}
                  >
                    {selectedTutor.verified ? 'Revoke Verification' : 'Verify Tutor'}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteTutor(selectedTutor)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
