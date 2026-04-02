import { useState } from 'react';
import { GraduationCap, Video, Calendar, Clock, Star, Users, BookOpen, Search, Filter, ArrowLeft, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';

import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// ─── Bids Sub-Collection List Component ──────────────────────────────────────
const BidsList: React.FC<{ requestId: string; onAssign: (tutorId: string) => void; isOwner: boolean; status: string; navigate: any }> = ({ requestId, onAssign, isOwner, status, navigate }) => {
  const { collection } = require('firebase/firestore');
  const [bidsSnap] = useCollection(collection(db, 'tuition_requests', requestId, 'bids'));
  const bids = bidsSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  return (
    <div className="space-y-3 mt-4 bg-gray-50 p-4 rounded-xl border">
      <h5 className="font-semibold text-sm text-[#2C3E50] flex items-center gap-1">
        <Users className="w-4 h-4 text-[#C4A672]" /> 
        Active Bids ({bids.length})
      </h5>
      {bids.map((b: any) => (
        <div key={b.id} className="p-3 bg-white rounded-lg border shadow-sm flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p className="font-medium text-sm text-[#2C3E50]">{b.tutorName}</p>
            <p className="text-xs text-[#C4A672] font-semibold">Rs. {b.amount}</p>
            {b.message && <p className="text-xs text-gray-500 mt-1">"{b.message}"</p>}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/chat', { state: { otherUser: { id: b.tutorId, name: b.tutorName, avatar: '', online: true } } })}
              className="h-8 text-xs border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672]/10"
            >
              Message
            </Button>
            {isOwner && status !== 'Assigned' && (
              <Button size="sm" onClick={() => onAssign(b.tutorId)} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                Assign
              </Button>
            )}
          </div>
        </div>
      ))}
      {bids.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No bids broadcasted inside this orbit yet.</p>}
    </div>
  );
};

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
  availableHours: string; // New field
  userId: string;
  bio?: string;
}

interface TuitionRequest {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  topic: string; // "Need Math Tutor..."
  gradeLevel: string;
  budget: string;
  createdAt: any;
  difficulty?: string;
  budget_range?: { min: number; max: number };
  location?: { zip: string };
  orbit_status?: string;
}

interface TuitionHubProps {
  onBack: () => void;
  isLoggedIn: boolean;
}

export function TuitionHub({ onBack, isLoggedIn }: TuitionHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [tutorForm, setTutorForm] = useState({
    subject: '',
    specialization: '',
    hourlyRate: '',
    experience: '',
    availability: 'Available',
    availableHours: '', // New field
    bio: '',
    certificate: null as string | null // New field
  });

  const [requestForm, setRequestForm] = useState({
    subject: '',
    topic: '',
    gradeLevel: '',
    budget: '',
    difficulty: 'Beginner',
    minBudget: '',
    maxBudget: '',
    location: ''
  });
  const [isPostingRequest, setIsPostingRequest] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);

  const [selectedRequestForBids, setSelectedRequestForBids] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState({ amount: '', message: '' });

  const [value, loading, error] = useCollection(collection(db, 'tutors'));
  const [requestsValue] = useCollection(query(collection(db, 'tuition_requests')));

  const [currentUserTutor] = useDocument(auth.currentUser ? doc(db, 'tutors', auth.currentUser.uid) : null);
  const tutorStatus = currentUserTutor?.data()?.verificationStatus || 'Unregistered';

  const tutors = value?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tutor)) || [];
  const tuitionRequests = requestsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as TuitionRequest)) || [];

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertFile(e.target.files[0]);
    }
  };

  const handlePostRequest = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to send a request');
      return;
    }
    try {
      if (editingRequestId) {
        await updateDoc(doc(db, 'tuition_requests', editingRequestId), {
          subject: requestForm.subject,
          topic: requestForm.topic,
          gradeLevel: requestForm.gradeLevel,
          difficulty: requestForm.difficulty,
          budget_range: { min: parseFloat(requestForm.minBudget || '0'), max: parseFloat(requestForm.maxBudget || '0') },
          location: { zip: requestForm.location },
        });
        toast.success('Request updated successfully!');
      } else {
        await addDoc(collection(db, 'tuition_requests'), {
          studentId: auth.currentUser.uid,
          studentName: auth.currentUser.displayName || 'Anonymous',
          subject: requestForm.subject,
          topic: requestForm.topic,
          gradeLevel: requestForm.gradeLevel,
          difficulty: requestForm.difficulty,
          budget_range: { min: parseFloat(requestForm.minBudget || '0'), max: parseFloat(requestForm.maxBudget || '0') },
          location: { zip: requestForm.location },
          orbit_status: 'Open',
          notified_tutors: [],
          createdAt: serverTimestamp()
        });
        toast.success('Request sent successfully!');
      }
      setIsPostingRequest(false);
      setEditingRequestId(null);
      setRequestForm({ subject: '', topic: '', gradeLevel: '', budget: '', difficulty: 'Beginner', minBudget: '', maxBudget: '', location: '' });
    } catch (err) {
      toast.error(editingRequestId ? 'Failed to update request' : 'Failed to send request');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await deleteDoc(doc(db, 'tuition_requests', requestId));
      toast.success('Request deleted');
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const handleEditRequest = (req: TuitionRequest) => {
    setRequestForm({
      subject: req.subject,
      topic: req.topic,
      gradeLevel: req.gradeLevel,
      budget: req.budget || '',
      difficulty: (req as any).difficulty || 'Beginner',
      minBudget: (req as any).budget_range?.min?.toString() || '',
      maxBudget: (req as any).budget_range?.max?.toString() || '',
      location: (req as any).location?.zip || ''
    });
    setEditingRequestId(req.id);
    setIsPostingRequest(true);
  };

  const handlePlaceBid = async (requestId: string) => {
    if (!auth.currentUser || !bidForm.amount.trim()) return;
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'tuition_requests', requestId, 'bids', auth.currentUser.uid), {
        tutorId: auth.currentUser.uid,
        tutorName: auth.currentUser.displayName || 'Anonymous',
        amount: parseFloat(bidForm.amount),
        message: bidForm.message,
        createdAt: serverTimestamp()
      });
      toast.success('Bid placed successfully! 🛰️');
      setBidForm({ amount: '', message: '' });
    } catch { toast.error('Failed to place bid'); }
  };

  const handleAssignTutor = async (requestId: string, tutorId: string) => {
    try {
      await updateDoc(doc(db, 'tuition_requests', requestId), {
        orbit_status: 'Assigned',
        assignedTutorId: tutorId
      });
      toast.success('Tutor assigned to orbit! 🎉');
    } catch { toast.error('Failed to assign tutor'); }
  };

  const handleBecomeTutor = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to become a tutor');
      return;
    }

    try {
      let certUrl = '';
      if (certFile) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const formData = new FormData();
        formData.append('file', certFile);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        certUrl = data.secure_url;
      }

      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'tutors', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Anonymous',
        avatar: auth.currentUser.photoURL || '',
        subject: tutorForm.subject,
        specialization: tutorForm.specialization,
        hourlyRate: parseFloat(tutorForm.hourlyRate),
        experience: tutorForm.experience,
        availability: tutorForm.availability,
        availableHours: tutorForm.availableHours,
        bio: tutorForm.bio,
        certificate: certUrl,
        rating: 0,
        reviews: 0,
        students: 0,
        verified: false,
        verificationStatus: 'Pending',
        createdAt: serverTimestamp()
      });
      toast.success('Tutor profile created successfully!');
      setIsRegistering(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create profile');
    }
  };

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tutor.subject?.toLowerCase().includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

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

          {/* Verification Status Banner */}
          {isLoggedIn && tutorStatus !== 'Unregistered' && tutorStatus !== 'Verified' && (
            <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 max-w-2xl ${tutorStatus === 'Rejected'
                ? 'bg-red-500/10 border-red-500/30 text-red-100'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
              }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Verification {tutorStatus}</p>
                <p className="text-sm opacity-90">
                  {tutorStatus === 'Reviewing'
                    ? 'Automated scans passed. Waiting for Admin manual review and approval.'
                    : 'Your trajectory failed stabilization phase. Please review and try again.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Banner */}
        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-[#C4A672]" />
            </div>
            <div className="text-2xl font-bold text-[#2C3E50] mb-1">500+</div>
            <div className="text-sm text-gray-600">Expert Tutors</div>
          </Card>
          <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#C4A672]" />
            </div>
            <div className="text-2xl font-bold text-[#2C3E50] mb-1">10K+</div>
            <div className="text-sm text-gray-600">Active Students</div>
          </Card>
          <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-[#C4A672]" />
            </div>
            <div className="text-2xl font-bold text-[#2C3E50] mb-1">50+</div>
            <div className="text-sm text-gray-600">Subjects</div>
          </Card>
          <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-[#C4A672]" />
            </div>
            <div className="text-2xl font-bold text-[#2C3E50] mb-1">4.8</div>
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
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!isLoggedIn) {
                    toast.error("Please login to register as a tutor");
                    return;
                  }
                  navigate('/tutor-verification');
                }}
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                {tutorStatus === 'Unregistered' ? 'Become a Tutor' : 'Review Verification'}
              </Button>
              <Dialog open={isPostingRequest} onOpenChange={(open: boolean) => {
                setIsPostingRequest(open);
                if (!open) {
                  setEditingRequestId(null);
                  setRequestForm({ subject: '', topic: '', gradeLevel: '', budget: '', difficulty: 'Beginner', minBudget: '', maxBudget: '', location: '' });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2C3E50] text-white hover:bg-[#1a252f]">
                    Request Tuition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRequestId ? 'Edit Tuition Request' : 'Request Tuition'}</DialogTitle>
                    <DialogDescription>
                      {editingRequestId ? 'Update your tuition request details.' : 'Post a request for a tutor to help you.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input placeholder="Subject (e.g. Math)" value={requestForm.subject} onChange={e => setRequestForm({ ...requestForm, subject: e.target.value })} />
                    <Input placeholder="Details (e.g. Need help with Grade 10 Geometry)" value={requestForm.topic} onChange={e => setRequestForm({ ...requestForm, topic: e.target.value })} />
                    <Input placeholder="Grade Level" value={requestForm.gradeLevel} onChange={e => setRequestForm({ ...requestForm, gradeLevel: e.target.value })} />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Difficulty</Label>
                        <select
                          value={requestForm.difficulty}
                          onChange={e => setRequestForm({ ...requestForm, difficulty: e.target.value })}
                          className="w-full border rounded h-10 px-3 bg-white text-sm"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Location (ZIP)</Label>
                        <Input placeholder="e.g. 54000" value={requestForm.location} onChange={e => setRequestForm({ ...requestForm, location: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min Budget (Rs.)</Label>
                        <Input type="number" placeholder="Min" value={requestForm.minBudget} onChange={e => setRequestForm({ ...requestForm, minBudget: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Max Budget (Rs.)</Label>
                        <Input type="number" placeholder="Max" value={requestForm.maxBudget} onChange={e => setRequestForm({ ...requestForm, maxBudget: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handlePostRequest} className="bg-[#C4A672] text-white">
                      {editingRequestId ? 'Update Request' : 'Send Request'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Tuition Requests Section */}
          {tuitionRequests.length > 0 && (
            <div className="mb-12">
              <h3 className="text-[#2C3E50] text-xl mb-4">Student Requests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tuitionRequests.map(req => (
                  <Card key={req.id} className="p-5 border border-blue-100 bg-blue-50/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="bg-white">{req.subject}</Badge>
                          <Badge className={
                            req.difficulty === 'Advanced' ? 'bg-red-100 text-red-700 border-red-200' :
                              req.difficulty === 'Intermediate' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-green-100 text-green-700 border-green-200'
                          } variant="outline">
                            {req.difficulty || 'Beginner'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            Status: {(req as any).orbit_status || 'Open'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {auth.currentUser?.uid === req.studentId && (
                            <div className="flex gap-1">
                              <button onClick={() => handleEditRequest(req)} className="text-gray-400 hover:text-[#C4A672] transition-colors p-1">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteRequest(req.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-[#2C3E50] mb-1">{req.topic}</h4>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> From {req.studentName}
                      </p>

                      <div className="bg-white/60 p-2 rounded-lg text-xs space-y-1 mb-3">
                        {(req as any).budget_range && (
                          <p><span className="text-gray-500">Budget:</span> <span className="font-semibold text-[#C4A672]">Rs. {(req as any).budget_range.min} - {(req as any).budget_range.max}</span></p>
                        )}
                        {(req as any).location?.zip && (
                          <p><span className="text-gray-500">Location (ZIP):</span> <span>{(req as any).location.zip}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-auto">
                      {auth.currentUser?.uid === req.studentId ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white text-xs py-1 h-8">
                              View Radar 🛰️ Bids
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Bids for "{req.topic}"</DialogTitle>
                            </DialogHeader>
                            <BidsList requestId={req.id} onAssign={(tId) => handleAssignTutor(req.id, tId)} isOwner={true} status={(req as any).orbit_status || 'Open'} navigate={navigate} />
                          </DialogContent>
                        </Dialog>
                      ) : tutorStatus === 'Verified' && (req as any).orbit_status !== 'Assigned' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full bg-[#2C3E50] hover:bg-[#1a252f] text-white text-xs py-1 h-8">
                              Express Interest 🚀
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Place a Bid</DialogTitle>
                              <DialogDescription>Offer your Expertise to this client.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-3 py-3">
                              <Input type="number" placeholder="Offer Amount (Rs.)" value={bidForm.amount} onChange={e => setBidForm({ ...bidForm, amount: e.target.value })} />
                              <Textarea placeholder="Message (Optional)" value={bidForm.message} onChange={e => setBidForm({ ...bidForm, message: e.target.value })} />
                              <Button onClick={() => handlePlaceBid(req.id)} className="bg-[#C4A672] text-white">Broadcast Bid</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
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
                      <p className="text-[#C4A672] text-xl">Rs. {tutor.hourlyRate}/hr</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedTutor(tutor);
                        }}
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (!isLoggedIn) {
                            toast.error("Please login to book a session");
                            navigate('/login');
                            return;
                          }
                          toast.info("Booking flow coming soon!");
                        }}
                      >
                        Book
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672]/10"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (isLoggedIn) {
                            navigate('/chat', { state: { otherUser: { id: tutor.userId, name: tutor.name, avatar: tutor.avatar, online: true } } });
                          } else {
                            toast.error("Please login to message a tutor");
                            navigate('/login');
                          }
                        }}
                      >
                        Message Tutor
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        < div className="mt-16" >
          <h2 className="text-[#2C3E50] text-2xl text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h3 className="text-[#2C3E50] font-semibold mb-2">1. Find Your Tutor</h3>
              <p className="text-gray-600 text-sm">
                Browse through our verified tutors and find the perfect match for your learning needs
              </p>
            </Card>
            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h3 className="text-[#2C3E50] font-semibold mb-2">2. Book a Session</h3>
              <p className="text-gray-600 text-sm">
                Schedule a convenient time slot and choose between one-on-one or group sessions
              </p>
            </Card>
            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#C4A672]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-[#C4A672]" />
              </div>
              <h3 className="text-[#2C3E50] font-semibold mb-2">3. Start Learning</h3>
              <p className="text-gray-600 text-sm">
                Join live video sessions and get personalized guidance from expert tutors
              </p>
            </Card>
          </div>
        </div>
      {/* Tutor Profile Modal */}
      <Dialog open={!!selectedTutor} onOpenChange={(open: boolean) => !open && setSelectedTutor(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tutor Profile</DialogTitle>
          </DialogHeader>
          {selectedTutor && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <ImageWithFallback
                  src={selectedTutor.avatar}
                  alt={selectedTutor.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#C4A672]"
                />
                <div>
                  <h2 className="text-xl font-bold text-[#2C3E50]">{selectedTutor.name}</h2>
                  <p className="text-[#C4A672] font-medium">{selectedTutor.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedTutor.availability === 'Available' ? 'default' : 'secondary'}>
                      {selectedTutor.availability}
                    </Badge>
                    {selectedTutor.verified && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Verified ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">About Me</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                  {selectedTutor.bio || "No biography provided yet."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Specialization</p>
                  <p className="font-medium text-[#2C3E50]">{selectedTutor.specialization}</p>
                </div>
                <div>
                  <p className="text-gray-500">Hourly Rate</p>
                  <p className="font-medium text-[#C4A672]">Rs. {selectedTutor.hourlyRate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium text-[#2C3E50]">{selectedTutor.experience || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Available Hours</p>
                  <p className="font-medium text-[#2C3E50]">{selectedTutor.availableHours || 'Flexible'}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setSelectedTutor(null)}>
                  Close
                </Button>
                <Button
                  className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  onClick={() => {
                    if (isLoggedIn) {
                      navigate('/chat', { state: { otherUser: { id: selectedTutor.userId, name: selectedTutor.name, avatar: selectedTutor.avatar, online: true } } });
                    } else {
                      toast.error("Please login to message this tutor");
                    }
                  }}
                >
                  Message Tutor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  </div >
  );
}
