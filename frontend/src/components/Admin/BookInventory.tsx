import { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Search, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { AddBookModal } from './AddBookModal';
import { db } from '../../firebase';
import { collection, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AdminBookRow {
  id: string;
  isbn: string;
  title: string;
  author: string;
  condition: string;
  category: string;
  price: number;
  status: string;
  type: string;
  userId: string;
  isSold?: boolean;
}

export function BookInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [booksSnap, loading] = useCollection(collection(db, 'books'));

  const [editingBook, setEditingBook] = useState<AdminBookRow | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    price: '',
    condition: 'Good',
    category: 'Fiction',
    status: 'active',
    isSold: false,
  });

  const books: AdminBookRow[] = useMemo(() => {
    if (!booksSnap?.docs.length) return [];
    return booksSnap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        isbn: String(x.isbn || 'N/A'),
        title: String(x.title || x.bookName || 'Untitled'),
        author: String(x.author || 'Unknown'),
        condition: String(x.condition || 'Good'),
        category: String(x.category || 'Uncategorized'),
        price: Number(x.price) || 0,
        status: String(x.status || 'active'),
        type: String(x.type || 'sell'),
        userId: String(x.userId || ''),
        isSold: x.isSold === true,
      };
    });
  }, [booksSnap]);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (book: AdminBookRow) => {
    if (book.isSold) return { label: 'Sold', className: 'bg-gray-200 text-gray-800' };
    if (book.status === 'pending') return { label: 'Pending review', className: 'bg-amber-100 text-amber-900' };
    return { label: book.status || 'active', className: 'bg-green-100 text-green-800' };
  };

  const openEdit = (book: AdminBookRow) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      author: book.author,
      price: String(book.price),
      condition: book.condition,
      category: book.category,
      status: book.status === 'pending' ? 'pending' : 'active',
      isSold: book.isSold === true,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBook) return;
    const price = parseFloat(editForm.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }
    try {
      await updateDoc(doc(db, 'books', editingBook.id), {
        title: editForm.title.trim(),
        author: editForm.author.trim(),
        price,
        condition: editForm.condition,
        category: editForm.category,
        status: editForm.status,
        isSold: editForm.isSold,
        updatedAt: serverTimestamp(),
      });
      toast.success('Listing updated');
      setEditingBook(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update listing');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book listing permanently?')) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      toast.success('Listing deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete listing');
    }
  };

  const openPublicListing = (id: string) => {
    window.open(`${window.location.origin}/book/${id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search title, author, ISBN, seller userId…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add listing
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Admins can create, view, edit, and delete any book listing. Sellers retain edit access to their own items.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading listings…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const badge = getStatusBadge(book);
            return (
              <div key={book.id} className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[#2C3E50] font-medium truncate">{book.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">by {book.author}</p>
                  </div>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">ISBN</span>
                    <span className="text-[#2C3E50] truncate">{book.isbn}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Type</span>
                    <span className="text-[#2C3E50]">{book.type}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Seller</span>
                    <span className="text-xs text-[#2C3E50] truncate max-w-[140px]" title={book.userId}>
                      {book.userId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Price</span>
                    <span className="text-[#C4A672] font-semibold">Rs. {book.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" onClick={() => openPublicListing(book.id)}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" onClick={() => openEdit(book)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 shrink-0"
                    onClick={() => handleDelete(book.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredBooks.length === 0 && (
        <div className="text-center py-12 text-gray-500">No listings match your search.</div>
      )}

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}

      <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="adm-title">Title</Label>
              <Input id="adm-title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="adm-author">Author</Label>
              <Input id="adm-author" value={editForm.author} onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="adm-price">Price (Rs.)</Label>
              <Input
                id="adm-price"
                type="number"
                min={0}
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={editForm.condition} onValueChange={(v) => setEditForm((f) => ({ ...f, condition: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['New', 'Like New', 'Good', 'Fair', 'Poor'].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adm-cat">Category</Label>
              <Input id="adm-cat" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div>
              <Label>Marketplace status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isSold}
                onChange={(e) => setEditForm((f) => ({ ...f, isSold: e.target.checked }))}
              />
              Mark as sold (hide from marketplace)
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingBook(null)}>
              Cancel
            </Button>
            <Button className="bg-[#C4A672] hover:bg-[#8B7355]" onClick={() => void handleSaveEdit()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
