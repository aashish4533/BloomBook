import { useState } from 'react';
import { FileText, Upload, Search, Filter, ArrowLeft, Download, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'sonner';
import { NotesViewer } from './NotesViewer';
import { useNavigate } from 'react-router-dom';

interface Note {
    id: string;
    title: string;
    subject: string;
    authorName: string;
    authorId: string;
    description: string;
    fileUrl: string;
    fileType: string; // 'pdf'
    createdAt: any;
    downloads: number;
    views: number;
}

export function NotesHub() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        subject: '',
        description: '',
        file: null as File | null
    });

    const [value, loading, error] = useCollection(
        query(collection(db, 'notes'), orderBy('createdAt', 'desc'))
    );

    const notes = value?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)) || [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                toast.error('Only PDF files are allowed');
                return;
            }
            setUploadForm({ ...uploadForm, file });
        }
    };

    const handleUpload = async () => {
        if (!auth.currentUser) {
            toast.error('Please login to upload notes');
            return;
        }
        if (!uploadForm.file || !uploadForm.title || !uploadForm.subject) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsUploading(true);

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

            if (!cloudName || !uploadPreset) {
                toast.error("Cloudinary credentials missing");
                setIsUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('upload_preset', uploadPreset);
            // Resource type auto allows PDF

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            const downloadURL = data.secure_url;

            await addDoc(collection(db, 'notes'), {
                title: uploadForm.title,
                subject: uploadForm.subject,
                description: uploadForm.description,
                authorName: auth.currentUser.displayName || 'Anonymous',
                authorId: auth.currentUser.uid,
                fileUrl: downloadURL,
                fileType: 'pdf',
                createdAt: serverTimestamp(),
                downloads: 0,
                views: 0
            });

            toast.success('Notes uploaded successfully!');
            setIsUploading(false);
            setUploadForm({ title: '', subject: '', description: '', file: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload notes');
            setIsUploading(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                        <Dialog open={isUploading} onOpenChange={setIsUploading}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Notes
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Study Notes (PDF)</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            placeholder="e.g. Calculus Chapter 1"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            value={uploadForm.subject}
                                            onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                                            placeholder="e.g. Mathematics"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={uploadForm.description}
                                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                            placeholder="Brief description of contents"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="file">PDF File</Label>
                                        <Input
                                            id="file"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <Button onClick={handleUpload} className="bg-[#C4A672] text-white">
                                        Upload
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-6 relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search notes by title or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div>Loading notes...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map((note) => (
                            <Card key={note.id} className="hover:shadow-lg transition-shadow p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-red-500" />
                                    </div>
                                    <Badge variant="outline">{note.subject}</Badge>
                                </div>

                                <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">{note.title}</h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{note.description}</p>

                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span>By {note.authorName}</span>
                                    <span>{new Date(note.createdAt?.toDate()).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
                                        onClick={() => setSelectedNote(note)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => window.open(note.fileUrl, '_blank')}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {selectedNote && (
                <NotesViewer
                    title={selectedNote.title}
                    author={selectedNote.authorName}
                    fileUrl={selectedNote.fileUrl}
                    onClose={() => setSelectedNote(null)}
                />
            )}
        </div>
    );
}
