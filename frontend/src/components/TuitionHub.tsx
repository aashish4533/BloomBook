import { useMemo, useState } from 'react';
import { GraduationCap, Video, Calendar, Clock, Star, Users, BookOpen, Search, Filter, ArrowLeft, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';

import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, query, deleteDoc, doc, updateDoc, orderBy, getDoc, setDoc, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { toast } from 'sonner';
import { notifyChatRecipient } from '../utils/chatNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
  assignedTutorId?: string;
  assignedTutorName?: string;
  status?: string;
  updatedAt?: any;
}

interface TuitionHubProps {
  onBack: () => void;
  isLoggedIn: boolean;
}

export function TuitionHub({ onBack, isLoggedIn }: TuitionHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [tutorAvailabilityFilter, setTutorAvailabilityFilter] = useState('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
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

  const [value, loading, error] = useCollection(collection(db, 'tutors'));
  const [requestsValue] = useCollection(
    query(collection(db, 'tuition_requests'), orderBy('createdAt', 'desc'))
  );

  const [currentUserTutor] = useDocument(auth.currentUser ? doc(db, 'tutors', auth.currentUser.uid) : null);
  const tutorStatus = currentUserTutor?.data()?.verificationStatus || 'Unregistered';
  const currentUserId = auth.currentUser?.uid || '';

  const tutors = value?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tutor)) || [];
  const tuitionRequests = requestsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as TuitionRequest)) || [];

  const tutorsByUserId = useMemo(
    () => new Map(tutors.map((tutor) => [tutor.userId, tutor])),
    [tutors]
  );

  const resetRequestForm = () => {
    setEditingRequestId(null);
    setRequestForm({
      subject: '',
      topic: '',
      gradeLevel: '',
      budget: '',
      difficulty: 'Beginner',
      minBudget: '',
      maxBudget: '',
      location: ''
    });
  };

  const openTuitionChat = async ({
    targetUserId,
    targetUserName,
    targetUserAvatar = '',
    requestId,
    requestTopic,
    initialMessage,
    studentId,
    tutorId
  }: {
    targetUserId: string;
    targetUserName: string;
    targetUserAvatar?: string;
    requestId?: string;
    requestTopic?: string;
    initialMessage?: string;
    studentId?: string;
    tutorId?: string;
  }) => {
    if (!auth.currentUser) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    try {
      const currentUid = auth.currentUser.uid;
      const chatId = [currentUid, targetUserId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);

      // setDoc + merge creates the thread if needed and avoids updateDoc on missing docs
      // (which can appear as permission errors under some rule/client combinations).
      await setDoc(
        chatRef,
        {
          participants: [currentUid, targetUserId],
          studentId: studentId || currentUid,
          tutorId: tutorId || targetUserId,
          status: 'active',
          tuitionRequestId: requestId || null,
          topic: requestTopic || '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      if (initialMessage) {
        const firstMsgSnap = await getDocs(
          query(collection(db, 'chats', chatId, 'messages'), limit(1))
        );
        if (firstMsgSnap.empty) {
          await addDoc(collection(db, 'chats', chatId, 'messages'), {
            text: initialMessage,
            senderId: currentUid,
            createdAt: serverTimestamp(),
            displayName: auth.currentUser.displayName || 'User'
          });
          await updateDoc(chatRef, {
            lastMessage: initialMessage,
            updatedAt: serverTimestamp(),
            lastMessageTimestamp: serverTimestamp()
          });
          notifyChatRecipient({
            recipientUserId: targetUserId,
            senderLabel: auth.currentUser?.displayName || 'Someone',
            preview: initialMessage,
            chatId,
          });
        }
      }

      navigate(`/chat/${chatId}`, {
        state: {
          otherUser: {
            id: targetUserId,
            name: targetUserName,
            avatar: targetUserAvatar,
            online: true
          }
        }
      });
    } catch (err) {
      console.error('Failed to open tuition chat:', err);
      toast.error('Failed to open chat');
    }
  };

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
    const minBudget = parseFloat(requestForm.minBudget || '0');
    const maxBudget = parseFloat(requestForm.maxBudget || '0');

    if (!requestForm.subject.trim() || !requestForm.topic.trim() || !requestForm.gradeLevel.trim()) {
      toast.error('Please complete subject, request details, and grade level');
      return;
    }

    if (!requestForm.location.trim()) {
      toast.error('Please add a ZIP code or location');
      return;
    }

    if (!minBudget || !maxBudget || minBudget <= 0 || maxBudget <= 0 || minBudget > maxBudget) {
      toast.error('Please enter a valid tuition budget range');
      return;
    }
    try {
      if (editingRequestId) {
        await updateDoc(doc(db, 'tuition_requests', editingRequestId), {
          subject: requestForm.subject,
          topic: requestForm.topic,
          gradeLevel: requestForm.gradeLevel,
          budget: `Rs. ${minBudget} - ${maxBudget}`,
          difficulty: requestForm.difficulty,
          budget_range: { min: minBudget, max: maxBudget },
          location: { zip: requestForm.location },
          updatedAt: serverTimestamp(),
        });
        toast.success('Request updated successfully!');
      } else {
        await addDoc(collection(db, 'tuition_requests'), {
          studentId: auth.currentUser.uid,
          studentName: auth.currentUser.displayName || 'Anonymous',
          subject: requestForm.subject,
          topic: requestForm.topic,
          gradeLevel: requestForm.gradeLevel,
          budget: `Rs. ${minBudget} - ${maxBudget}`,
          difficulty: requestForm.difficulty,
          budget_range: { min: minBudget, max: maxBudget },
          location: { zip: requestForm.location },
          orbit_status: 'Open',
          notified_tutors: [],
          createdAt: serverTimestamp()
        });
        toast.success('Request sent successfully!');
      }
      setIsPostingRequest(false);
      resetRequestForm();
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

  const handleTakeTuition = async (request: TuitionRequest) => {
    if (!auth.currentUser) {
      toast.error('Please login to take this request');
      navigate('/login');
      return;
    }

    if (auth.currentUser.uid === request.studentId) {
      toast.error('You cannot take your own tuition request');
      return;
    }

    if (tutorStatus !== 'Verified') {
      toast.error('Only verified tutors can take tuition requests');
      return;
    }

    try {
      const requestRef = doc(db, 'tuition_requests', request.id);
      const requestSnap = await getDoc(requestRef);
      const requestData = requestSnap.data() as TuitionRequest | undefined;
      const studentId = requestData?.studentId;
      const tutorId = auth.currentUser.uid;
      const tutorName =
        tutorsByUserId.get(tutorId)?.name ||
        auth.currentUser.displayName ||
        'Tutor';

      if (!requestSnap.exists() || !requestData) {
        toast.error('This tuition request is no longer available');
        return;
      }

      if (!studentId) {
        toast.success('Request accepted! 🎉');
        return;
      }

      if ((requestData.orbit_status || 'Open') === 'Assigned') {
        if (requestData.assignedTutorId === tutorId) {
          await openTuitionChat({
            targetUserId: studentId,
            targetUserName: requestData.studentName,
            requestId: request.id,
            requestTopic: requestData.topic,
            studentId,
            tutorId
          });
          return;
        }

        toast.error('This tuition request has already been taken');
        return;
      }

      await updateDoc(requestRef, {
        orbit_status: 'Assigned',
        status: 'accepted',
        assignedTutorId: tutorId,
        assignedTutorName: tutorName,
        updatedAt: serverTimestamp()
      });

      toast.success('Tuition request assigned successfully');

      await openTuitionChat({
        targetUserId: studentId,
        targetUserName: requestData.studentName,
        requestId: request.id,
        requestTopic: requestData?.topic || '',
        initialMessage: `Hi ${requestData.studentName}, I have taken your tuition request for "${requestData?.topic || 'this request'}". Let's discuss tuition timing, location, course content, and other details here.`,
        studentId,
        tutorId
      });
    } catch (err) {
      console.error('Failed to take request:', err);
      toast.error('Failed to take request');
    }
  };

  const handleBecomeTutor = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to become a tutor');
      return;
    }

    try {
      let certUrl = '';
      if (certFile) {
        try {
          const uniqueId = `${Date.now()}_${certFile.name.replace(/\s+/g, '_')}`;
          const storageRef = ref(storage, `verifications/${auth.currentUser.uid}/${uniqueId}`);
          
          await uploadBytes(storageRef, certFile);
          certUrl = await getDownloadURL(storageRef);
        } catch (err) {
          console.error('[Storage] Upload failed:', err);
          toast.error("Failed to upload certificate");
          return;
        }
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

  // ── Book Tutor / Start Chat ─────────────────────────────────────────
  const handleBookTutor = async (tutor: Tutor) => {
    if (!auth.currentUser) {
      toast.error('Please login to book a tutor');
      navigate('/login');
      return;
    }
    await openTuitionChat({
      targetUserId: tutor.userId,
      targetUserName: tutor.name,
      targetUserAvatar: tutor.avatar,
      initialMessage: `Hi ${tutor.name}, I would like to book a tuition session for ${tutor.subject}. I saw your rate is Rs. ${tutor.hourlyRate}/hr.`,
      studentId: auth.currentUser.uid,
      tutorId: tutor.userId
    });
  };

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tutor.subject?.toLowerCase().includes(activeCategory);
    const matchesAvailability =
      tutorAvailabilityFilter === 'all' ||
      (tutorAvailabilityFilter === 'verified' && tutor.verified) ||
      (tutorAvailabilityFilter === 'available' && tutor.availability === 'Available');
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const filteredRequests = tuitionRequests.filter((req) => {
    const matchesSearch =
      req.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      requestStatusFilter === 'all' ||
      (requestStatusFilter === 'open' && (req.orbit_status || 'Open') === 'Open') ||
      (requestStatusFilter === 'assigned' && (req.orbit_status || '') === 'Assigned');

    return matchesSearch && matchesStatus;
  });

  const activeSessions = tuitionRequests
    .filter((req) => req.orbit_status === 'Assigned' && currentUserId && (req.studentId === currentUserId || req.assignedTutorId === currentUserId))
    .map((req) => {
      const isStudent = req.studentId === currentUserId;
      const assignedTutor = req.assignedTutorId ? tutorsByUserId.get(req.assignedTutorId) : undefined;

      return {
        id: req.id,
        subject: req.subject,
        topic: req.topic,
        counterpartId: isStudent ? req.assignedTutorId || '' : req.studentId,
        counterpartName: isStudent ? req.assignedTutorName || assignedTutor?.name || 'Assigned Tutor' : req.studentName,
        counterpartAvatar: isStudent ? assignedTutor?.avatar || '' : '',
        roleLabel: isStudent ? 'Tutor' : 'Student'
      };
    })
    .filter((session) => session.counterpartId);

  const requestDialogContent = (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingRequestId ? 'Edit Tuition Request' : 'Request Tuition'}</DialogTitle>
        <DialogDescription>
          {editingRequestId ? 'Update your tuition request details.' : 'Post a request for a tutor to help you.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Input placeholder="Subject (e.g. Math)" value={requestForm.subject} onChange={e => setRequestForm({ ...requestForm, subject: e.target.value })} />
        <Textarea placeholder="Details (e.g. Need help with Grade 10 Geometry)" value={requestForm.topic} onChange={e => setRequestForm({ ...requestForm, topic: e.target.value })} className="min-h-[100px]" />
        <Input placeholder="Grade Level" value={requestForm.gradeLevel} onChange={e => setRequestForm({ ...requestForm, gradeLevel: e.target.value })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  );

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

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl mb-2">Online Tuition Hub</h1>
                <p className="text-white/90">Connect with expert tutors for personalized learning</p>
              </div>
            </div>
            <Button
              className="shrink-0 w-full sm:w-auto lg:self-center min-h-11 px-6 rounded-lg font-semibold bg-[#2C3E50] text-white shadow-md hover:bg-[#1a252f] border-2 border-white/90"
              onClick={() => {
                if (!isLoggedIn) {
                  toast.error('Please login to verify as a tutor');
                  return;
                }
                navigate('/tutor-verification');
              }}
            >
              Tutor verification
            </Button>
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
        {/* Active Tuition Sessions */}
        {isLoggedIn && activeSessions.length > 0 && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-[#C4A672]/10 to-transparent">
            <h3 className="text-[#2C3E50] text-xl mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#C4A672]" />
              Active Tuition Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-[#C4A672] rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#2C3E50]">{session.subject}</h4>
                    <p className="text-sm text-gray-600">{session.topic}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Connected with {session.roleLabel}: {session.counterpartName}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#C4A672] hover:bg-[#8B7355] w-full sm:w-auto"
                    onClick={() => openTuitionChat({
                      targetUserId: session.counterpartId,
                      targetUserName: session.counterpartName,
                      targetUserAvatar: session.counterpartAvatar,
                      requestId: session.id,
                      requestTopic: session.topic
                    })}
                  >
                    Open Chat
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                className={activeCategory === category.id ? 'bg-[#C4A672] hover:bg-[#8B7355] min-h-[44px] flex-shrink-0' : 'min-h-[44px] flex-shrink-0'}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>

        <div className="flex justify-end mb-8">
          <Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white border border-gray-200 rounded-xl p-4">
            <div>
              <Label className="text-xs text-gray-600">Tutor filter</Label>
              <Select value={tutorAvailabilityFilter} onValueChange={setTutorAvailabilityFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Tutor filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tutors</SelectItem>
                  <SelectItem value="verified">Verified tutors</SelectItem>
                  <SelectItem value="available">Available now</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Request status</Label>
              <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Request status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All requests</SelectItem>
                  <SelectItem value="open">Open requests</SelectItem>
                  <SelectItem value="assigned">Assigned requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Tutors Grid & Tuition Requests Wrap in Tabs */}
        <Tabs defaultValue="tutors" className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
            <TabsTrigger value="requests">Request Tuition</TabsTrigger>
          </TabsList>

          <TabsContent value="tutors">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-[#2C3E50] text-2xl">Available Tutors ({filteredTutors.length})</h2>
              <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.length > 0 ? (
              filteredTutors.map((tutor) => (
                <Card key={tutor.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    {/* Tutor Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <ImageWithFallback
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#C4A672]/20"
                        />
                        {tutor.verified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#2C3E50] font-semibold">{tutor.name}</h3>
                        <p className="text-sm text-gray-600">{tutor.subject}</p>
                        <Badge
                          variant={tutor.availability === 'Available' ? 'default' : 'secondary'}
                          className="mt-1 text-[10px] h-5"
                        >
                          {tutor.availability}
                        </Badge>
                      </div>
                    </div>

                    {/* Specialization */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">{tutor.specialization}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center py-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-0.5">
                          <Star className="w-3.5 h-3.5 fill-yellow-500" />
                          <span className="text-sm font-bold text-[#2C3E50]">{tutor.rating || '5.0'}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{tutor.reviews || 0} reviews</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-0.5 text-[#C4A672]">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold text-[#2C3E50]">{tutor.students || 0}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">students</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-0.5 text-[#C4A672]">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold text-[#2C3E50]">{tutor.experience || '1y'}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">exp</p>
                      </div>
                    </div>

                    {/* Pricing & Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-500">Hourly Rate</p>
                        <p className="text-[#C4A672] font-bold">Rs. {tutor.hourlyRate?.toLocaleString()}/hr</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672]/10"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedTutor(tutor);
                          }}
                        >
                          Profile
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-[#C4A672] hover:bg-[#8B7355] text-white"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleBookTutor(tutor);
                          }}>
                          Book
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No tutors match your search</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search keywords to find more educators.</p>
              </div>
            )}
          </div>
          </TabsContent>

          <TabsContent value="requests">
            <Dialog open={isPostingRequest} onOpenChange={(open: boolean) => {
              setIsPostingRequest(open);
              if (!open) {
                resetRequestForm();
              }
            }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-[#2C3E50] text-xl font-semibold">Tuition requests ({filteredRequests.length})</h2>
              <DialogTrigger asChild>
                <Button className="bg-[#2C3E50] text-white hover:bg-[#1a252f] w-full sm:w-auto">
                  Request Tuition
                </Button>
              </DialogTrigger>
            </div>
            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRequests.map(req => (
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
                            Status: {req.orbit_status || 'Open'}
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
                        {req.budget_range && (
                          <p><span className="text-gray-500">Budget:</span> <span className="font-semibold text-[#C4A672]">Rs. {req.budget_range.min} - {req.budget_range.max}</span></p>
                        )}
                        {req.location?.zip && (
                          <p><span className="text-gray-500">Location (ZIP):</span> <span>{req.location.zip}</span></p>
                        )}
                        {req.orbit_status === 'Assigned' && req.assignedTutorName && (
                          <p><span className="text-gray-500">Assigned Tutor:</span> <span>{req.assignedTutorName}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-auto">
                      {auth.currentUser?.uid === req.studentId ? (
                        req.orbit_status === 'Assigned' && req.assignedTutorId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => openTuitionChat({
                              targetUserId: req.assignedTutorId!,
                              targetUserName: req.assignedTutorName || tutorsByUserId.get(req.assignedTutorId || '')?.name || 'Assigned Tutor',
                              targetUserAvatar: tutorsByUserId.get(req.assignedTutorId || '')?.avatar || '',
                              requestId: req.id,
                              requestTopic: req.topic,
                              studentId: req.studentId,
                              tutorId: req.assignedTutorId
                            })}
                          >
                            Open Tuition Chat
                          </Button>
                        ) : (
                          <p className="text-xs text-gray-500 text-center">
                            The first verified tutor to take this request will be connected with you here.
                          </p>
                        )
                      ) : tutorStatus === 'Verified' && req.orbit_status !== 'Assigned' ? (
                        <Button
                          size="sm"
                          onClick={() => handleTakeTuition(req)}
                          className="w-full bg-[#2C3E50] hover:bg-[#1a252f] text-white text-xs py-1 h-8"
                        >
                          Take Tuition
                        </Button>
                      ) : req.orbit_status === 'Assigned' && req.assignedTutorId === auth.currentUser?.uid ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => openTuitionChat({
                            targetUserId: req.studentId,
                            targetUserName: req.studentName,
                            requestId: req.id,
                            requestTopic: req.topic,
                            studentId: req.studentId,
                            tutorId: req.assignedTutorId
                          })}
                        >
                          Open Tuition Chat
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">No Tuition Requests Yet</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Be the first to post a request or explore our available tutors to start your learning journey.</p>
                <DialogTrigger asChild>
                  <Button className="bg-[#C4A672] text-white hover:bg-[#8B7355]">
                    Post a Tuition Request
                  </Button>
                </DialogTrigger>
              </div>
            )}
            {requestDialogContent}
            </Dialog>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
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
                      handleBookTutor(selectedTutor);
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
    </div>
  </div>
  );
}
