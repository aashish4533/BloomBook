import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Trash2, Download, FileText, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';

interface Note {
    id: string;
    title: string;
    subject: string;
    authorName: string;
    uploadedBy: string; // New field
    url: string; // New field
    fileType: string;
    timestamp: any; // New field
    // Legacy fields support
    authorEmail?: string;
    fileUrl?: string;
    createdAt?: any;
    description?: string;
}

export function NotesManagement() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingNote, setDeletingNote] = useState<Note | null>(null);

    // Edit State
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editForm, setEditForm] = useState({ title: '', subject: '', description: '' });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        // Order by timestamp desc
        const q = query(collection(db, 'notes'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedNotes = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Map legacy fields
                    url: data.url || data.fileUrl,
                    timestamp: data.timestamp || data.createdAt,
                    uploadedBy: data.uploadedBy || data.authorEmail,
                } as Note;
            });
            setNotes(loadedNotes);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async () => {
        if (!deletingNote) return;
        try {
            await deleteDoc(doc(db, 'notes', deletingNote.id));
            toast.success('Material deleted successfully');
            setDeletingNote(null);
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete material');
        }
    };

    const handleOpenEdit = (note: Note) => {
        setEditForm({
            title: note.title,
            subject: note.subject,
            description: note.description || ''
        });
        setEditingNote(note);
    };

    const handleSaveEdit = async () => {
        if (!editingNote) return;
        setIsSavingEdit(true);
        try {
            await updateDoc(doc(db, 'notes', editingNote.id), {
                title: editForm.title,
                subject: editForm.subject,
                description: editForm.description
            });
            toast.success('Note updated successfully');
            setEditingNote(null);
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update note');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.authorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Notes Management</h2>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Materials ({notes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Uploaded By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredNotes.map((note) => (
                                <TableRow key={note.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            {note.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>{note.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="uppercase text-xs">
                                            {note.fileType || 'unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{note.authorName}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{note.uploadedBy}</TableCell>
                                    <TableCell>
                                        {note.timestamp?.toDate ? new Date(note.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => window.open(note.url, '_blank')}
                                            disabled={!note.url}
                                            title="Download/View"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenEdit(note)}
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingNote(note)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredNotes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No materials found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingNote} onOpenChange={(open: boolean) => !open && setEditingNote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Note</DialogTitle>
                        <DialogDescription>Admin override: Update note details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Input
                                value={editForm.subject}
                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
                            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                                {isSavingEdit ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deletingNote} onOpenChange={(open: boolean) => !open && setDeletingNote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingNote?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeletingNote(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
