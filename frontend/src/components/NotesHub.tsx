import { useState } from 'react';
import { FileText, Upload, Search, ArrowLeft, Download, Eye, Trash2, Pencil, Loader2, ClipboardList, Calendar, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'sonner';
import { NotesViewer } from './NotesViewer';
import { useNavigate } from 'react-router-dom';
import { downloadFile } from '../utils/fileHandler';
import { FilePreview } from './FilePreview';
import { openMaterialRequestChat } from '../utils/chatUtils';

const EXPLORE_CATEGORIES = [
    'Computer Science',
    'Mathematics',
    'Blockchain',
    'Data Structures',
    'Programming',
    'Machine Learning',
] as const;

interface MaterialRequest {
    id: string;
    materialType: string;
    course: string;
    title: string;
    details: string;
    requesterId: string;
    requesterEmail?: string;
    requesterName: string;
    createdAt: any;
}

interface Note {
    id: string;
    title: string;
    subject: string;
    authorName: string; // Keep for display
    uploadedBy: string; // New field for permission (email)
    description: string;
    url: string; // New field (was fileUrl)
    fileType: string;
    timestamp: any; // New field (was createdAt)
    downloads: number;
    views: number;
    averageRating: number; // New field
    comments: any[]; // New field
}

export function NotesHub() {
    const navigate = useNavigate();
    const [hubSearch, setHubSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [previewNote, setPreviewNote] = useState<Note | null>(null); // New state for preview dialog
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false); // New state for dialog visibility
    const [uploadProgress, setUploadProgress] = useState(0); // Progress state
    const [uploadForm, setUploadForm] = useState({
        title: '',
        subject: '',
        description: '',
        file: null as File | null
    });

    // Edit state
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editForm, setEditForm] = useState({ title: '', subject: '', description: '' });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete confirmation state
    const [deletingNote, setDeletingNote] = useState<Note | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({
        materialType: 'notes',
        course: '',
        title: '',
        details: ''
    });
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

    const [value, loading, error] = useCollection(
        query(collection(db, 'notes'), orderBy('timestamp', 'desc')) // Order by new field
    );
    const [requestsSnap, requestsLoading] = useCollection(
        query(collection(db, 'material_requests'), orderBy('createdAt', 'desc'))
    );

    const notes = value?.docs.map(doc => {
        const data = doc.data();
        // Map old fields to new schema for backward compatibility if needed
        return {
            id: doc.id,
            ...data,
            url: data.url || data.fileUrl,
            timestamp: data.timestamp || data.createdAt,
            uploadedBy: data.uploadedBy || data.authorEmail
        } as Note;
    }) || [];

    const materialRequests: MaterialRequest[] = requestsSnap?.docs.map((d) => ({
        id: d.id,
        ...d.data()
    } as MaterialRequest)) || [];

    const currentUserEmail = auth.currentUser?.email;
    const currentUserId = auth.currentUser?.uid;

    const handleSubmitMaterialRequest = async () => {
        if (!auth.currentUser) {
            toast.error('Please log in to post a request');
            navigate('/login');
            return;
        }
        if (!requestForm.course.trim() || !requestForm.title.trim()) {
            toast.error('Course and what you need are required');
            return;
        }
        setIsSubmittingRequest(true);
        try {
            await addDoc(collection(db, 'material_requests'), {
                materialType: requestForm.materialType,
                course: requestForm.course.trim(),
                title: requestForm.title.trim(),
                details: requestForm.details.trim(),
                requesterId: auth.currentUser.uid,
                requesterEmail: auth.currentUser.email || null,
                requesterName: auth.currentUser.displayName || 'Anonymous',
                createdAt: serverTimestamp()
            });
            toast.success('Your request was posted');
            setRequestForm({ materialType: 'notes', course: '', title: '', details: '' });
            setIsRequestDialogOpen(false);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Failed to post request');
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const handleSendMaterial = async (req: MaterialRequest) => {
        if (!auth.currentUser) {
            toast.error('Please log in to send material');
            navigate('/login');
            return;
        }
        if (auth.currentUser.uid === req.requesterId) {
            return;
        }
        try {
            await openMaterialRequestChat(navigate, auth.currentUser.uid, req);
        } catch (e) {
            console.error(e);
            toast.error('Could not open chat');
        }
    };

    const handleDeleteMaterialRequest = async (id: string) => {
        if (!window.confirm('Remove this request?')) return;
        setDeletingRequestId(id);
        try {
            await deleteDoc(doc(db, 'material_requests', id));
            toast.success('Request removed');
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Failed to remove request');
        } finally {
            setDeletingRequestId(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadForm({ ...uploadForm, file });
        }
    };

    const handleUpload = async () => {
        if (!auth.currentUser || !auth.currentUser.email) {
            toast.error('Please login to upload notes');
            return;
        }
        if (!uploadForm.file || !uploadForm.title || !uploadForm.subject) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const file = uploadForm.file;
            const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

            // Storage Path: helping-material/{userEmail}/{fileName}
            const storagePath = `helping-material/${auth.currentUser.email}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    console.error("Upload error:", error);
                    toast.error(`Upload failed: ${error.message}`);
                    setIsUploading(false);
                },
                async () => {
                    // Upload completed successfully
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        await addDoc(collection(db, 'notes'), {
                            title: uploadForm.title,
                            subject: uploadForm.subject,
                            description: uploadForm.description,
                            authorName: auth.currentUser?.displayName || 'Anonymous',
                            uploadedBy: auth.currentUser?.email, // Permission field
                            url: downloadURL,
                            fileType: fileType,
                            timestamp: serverTimestamp(),
                            downloads: 0,
                            views: 0,
                            averageRating: 0,
                            comments: []
                        });

                        toast.success('Material uploaded successfully!');
                        // Reset form
                        setUploadForm({ title: '', subject: '', description: '', file: null });
                        setIsUploadDialogOpen(false); // Close dialog

                    } catch (dbError: any) {
                        console.error("Database error:", dbError);
                        toast.error(`Failed to save metadata: ${dbError.message}`);
                    } finally {
                        setIsUploading(false);
                    }
                }
            );

        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Failed to initiate upload');
            setIsUploading(false);
        }
    };

    // ── Edit handler ────────────────────────────────────────────────────

    const openEditDialog = (note: Note) => {
        setEditForm({ title: note.title, subject: note.subject, description: note.description });
        setEditingNote(note);
    };

    const handleSaveEdit = async () => {
        if (!editingNote) return;
        if (!editForm.title.trim() || !editForm.subject.trim()) {
            toast.error('Title and subject are required');
            return;
        }

        setIsSavingEdit(true);
        try {
            await updateDoc(doc(db, 'notes', editingNote.id), {
                title: editForm.title.trim(),
                subject: editForm.subject.trim(),
                description: editForm.description.trim(),
            });
            toast.success('Note updated successfully!');
            setEditingNote(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Failed to update note');
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Delete handler ──────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deletingNote) return;

        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'notes', deletingNote.id));
            toast.success('Note deleted successfully!');
            setDeletingNote(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Failed to delete note');
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Filtering ───────────────────────────────────────────────────────

    const q = hubSearch.trim().toLowerCase();
    const filteredMaterialRequests = materialRequests.filter((r) => {
        if (!q) return true;
        return (
            r.title.toLowerCase().includes(q) ||
            r.course.toLowerCase().includes(q) ||
            r.materialType.toLowerCase().includes(q) ||
            (r.details || '').toLowerCase().includes(q)
        );
    });

    const filteredNotes = notes.filter((note) => {
        const matchesSearch =
            !q ||
            note.title.toLowerCase().includes(q) ||
            note.subject.toLowerCase().includes(q) ||
            (note.description || '').toLowerCase().includes(q);
        const cat = (categoryFilter || '').toLowerCase();
        const matchesCategory =
            !categoryFilter ||
            note.subject.toLowerCase().includes(cat) ||
            note.title.toLowerCase().includes(cat) ||
            (note.description || '').toLowerCase().includes(cat);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
            {/* Header */}
            <div className="bg-[#2C3E50] text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl mb-2 flex items-center gap-3">
                                <FileText className="w-8 h-8 text-[#C4A672]" />
                                Notes Sharing Hub
                            </h1>
                            <p className="text-white/80">Share and discover study materials</p>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    Request Material
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Request material</DialogTitle>
                                    <DialogDescription>
                                        Ask for a specific book, notes, slides, or anything else for a course. Anyone browsing the hub can see your request.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="req-type">Type</Label>
                                        <select
                                            id="req-type"
                                            value={requestForm.materialType}
                                            onChange={(e) => setRequestForm({ ...requestForm, materialType: e.target.value })}
                                            className="w-full border rounded-md h-10 px-3 bg-white text-sm"
                                        >
                                            <option value="book">Book</option>
                                            <option value="notes">Notes</option>
                                            <option value="slides">Slides / handouts</option>
                                            <option value="past_papers">Past papers</option>
                                            <option value="other">Other material</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="req-course">Course / subject</Label>
                                        <Input
                                            id="req-course"
                                            value={requestForm.course}
                                            onChange={(e) => setRequestForm({ ...requestForm, course: e.target.value })}
                                            placeholder="e.g. CS1001 — Data Structures"
                                            disabled={isSubmittingRequest}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="req-title">What do you need?</Label>
                                        <Input
                                            id="req-title"
                                            value={requestForm.title}
                                            onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                                            placeholder="e.g. Instructor slides for week 3–5, or CLRS textbook PDF"
                                            disabled={isSubmittingRequest}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="req-details">Details (optional)</Label>
                                        <Textarea
                                            id="req-details"
                                            value={requestForm.details}
                                            onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                                            placeholder="Edition, language, deadline, link to syllabus, etc."
                                            className="min-h-[100px]"
                                            disabled={isSubmittingRequest}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleSubmitMaterialRequest}
                                        className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                                        disabled={isSubmittingRequest}
                                    >
                                        {isSubmittingRequest ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Posting…
                                            </>
                                        ) : (
                                            'Post request'
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Material
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Study Material</DialogTitle>
                                    <DialogDescription>
                                        Share your study materials (Docs, Images, Videos, PDFs) with others.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            placeholder="e.g. Calculus Chapter 1"
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            value={uploadForm.subject}
                                            onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                                            placeholder="e.g. Mathematics"
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={uploadForm.description}
                                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                            placeholder="Brief description of contents"
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="file">Material File</Label>
                                        <Input
                                            id="file"
                                            type="file"
                                            accept="image/*,video/*,.doc,.docx,.txt,.pdf"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                        />
                                    </div>

                                    {isUploading && (
                                        <div className="space-y-1">
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#C4A672] transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-center text-gray-500">Uploading... {uploadProgress}%</p>
                                        </div>
                                    )}

                                    <Button onClick={handleUpload} className="bg-[#C4A672] text-white" disabled={isUploading}>
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload'
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 mb-6">
                    <div className="relative max-w-3xl">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <Input
                            type="search"
                            placeholder="Search requests, shared files, or categories…"
                            value={hubSearch}
                            onChange={(e) => setHubSearch(e.target.value)}
                            className="h-11 w-full border-gray-200 bg-gray-50 pe-3 ps-14"
                            aria-label="Search hub"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: material requests */}
                    <section className="lg:col-span-3 space-y-4" aria-labelledby="material-requests-heading">
                        <h2 id="material-requests-heading" className="text-base font-semibold text-[#2C3E50]">
                            Material requests
                        </h2>
                        {requestsLoading ? (
                            <p className="text-gray-500 text-sm">Loading…</p>
                        ) : filteredMaterialRequests.length === 0 ? (
                            <p className="text-gray-500 text-sm">No requests match. Post one with &quot;Request Material&quot;.</p>
                        ) : (
                            <div className="space-y-4">
                                {filteredMaterialRequests.map((req) => {
                                    const isMine = !!currentUserId && currentUserId === req.requesterId;
                                    const typeLabel = req.materialType.replace(/_/g, ' ');
                                    const showSendMaterial = !isMine;
                                    return (
                                        <Card key={req.id} className="p-4 border border-gray-200 bg-white shadow-sm">
                                            <div className="flex flex-wrap items-start gap-2 mb-2">
                                                <Badge variant="secondary" className="capitalize">{typeLabel}</Badge>
                                                <Badge variant="outline" className="font-normal">{req.course}</Badge>
                                                <Badge className="bg-green-100 text-green-800 border-0 ml-auto shrink-0">Request Open</Badge>
                                            </div>
                                            <h3 className="font-semibold text-[#2C3E50] text-sm mb-1">{req.title}</h3>
                                            {req.details ? (
                                                <p className="text-xs text-gray-600 line-clamp-4 mb-3">{req.details}</p>
                                            ) : null}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                                <span>{req.requesterName}</span>
                                                {req.createdAt?.toDate ? (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(req.createdAt.toDate()).toLocaleDateString()}
                                                    </span>
                                                ) : null}
                                                {isMine && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteMaterialRequest(req.id)}
                                                        disabled={deletingRequestId === req.id}
                                                        className="ml-auto p-1 rounded text-gray-400 hover:text-red-600"
                                                        title="Remove request"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {showSendMaterial && (
                                                <Button
                                                    type="button"
                                                    className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
                                                    onClick={() => handleSendMaterial(req)}
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Send material
                                                </Button>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Center: shared materials */}
                    <section className="lg:col-span-6 space-y-4" aria-labelledby="shared-materials-heading">
                        <h2 id="shared-materials-heading" className="text-base font-semibold text-[#2C3E50]">
                            Shared materials
                        </h2>
                        {loading ? (
                            <p className="text-gray-500 text-sm">Loading…</p>
                        ) : filteredNotes.length === 0 ? (
                            <p className="text-gray-500 text-sm">No shared materials match your search or category.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {filteredNotes.map((note) => {
                                    const isOwner = currentUserEmail === note.uploadedBy;
                                    return (
                                        <Card key={note.id} className="hover:shadow-md transition-shadow p-5 border border-gray-200">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-3 bg-red-100 rounded-lg">
                                                    <FileText className="w-6 h-6 text-red-500" />
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    <Badge variant="outline">{note.subject}</Badge>
                                                    {isOwner && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditDialog(note)}
                                                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingNote(note)}
                                                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">{note.title}</h3>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{note.description}</p>
                                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                                <span>By {note.authorName}</span>
                                                <span>{note.timestamp?.toDate ? new Date(note.timestamp.toDate()).toLocaleDateString() : ''}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
                                                    onClick={() => setPreviewNote(note)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-[#2C3E50] text-[#2C3E50]"
                                                    disabled={!note.url}
                                                    onClick={() => downloadFile(note.url, `${note.title}.${note.fileType || 'pdf'}`)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Right: categories */}
                    <aside className="lg:col-span-3 lg:sticky lg:top-4 space-y-3" aria-label="Explore categories">
                        <h2 className="text-base font-semibold text-[#2C3E50]">
                            Explore categories <span className="text-xs font-normal text-[#C4A672]">NEW</span>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {EXPLORE_CATEGORIES.map((cat) => {
                                const active = categoryFilter === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategoryFilter(active ? null : cat)}
                                        className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                                            active
                                                ? 'border-[#C4A672] bg-[#C4A672]/15 text-[#2C3E50]'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-[#C4A672]/50'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500">Tap a category to filter shared materials. Tap again to clear.</p>
                    </aside>
                </div>
            </div>

            {/* ── NotesViewer overlay ──────────────────────────────────────── */}
            {selectedNote && (
                <NotesViewer
                    title={selectedNote.title}
                    author={selectedNote.authorName}
                    id={selectedNote.id} // Passing ID for comments
                    url={selectedNote.url}
                    onClose={() => setSelectedNote(null)}
                />
            )}

            {/* ── Edit Dialog ─────────────────────────────────────────────── */}
            <Dialog open={!!editingNote} onOpenChange={(open: boolean) => !open && setEditingNote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Note</DialogTitle>
                        <DialogDescription>
                            Update the details of your uploaded note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-subject">Subject</Label>
                            <Input
                                id="edit-subject"
                                value={editForm.subject}
                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditingNote(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                            >
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ──────────────────────────────── */}
            <Dialog open={!!deletingNote} onOpenChange={(open: boolean) => !open && setDeletingNote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Note</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>"{deletingNote?.title}"</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={() => setDeletingNote(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── File Preview Dialog ────────────────────────────────────── */}
            <Dialog open={!!previewNote} onOpenChange={(open: boolean) => !open && setPreviewNote(null)}>
                <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>{previewNote?.title}</DialogTitle>
                        <DialogDescription>
                            {previewNote?.subject} - {previewNote?.authorName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-gray-100 p-4">
                        {previewNote?.url && (
                            <FilePreview
                                fileUrl={previewNote.url}
                                fileType={previewNote.fileType}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
