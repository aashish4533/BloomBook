// Updated src/components/Admin/BookInventory.tsx
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { AddBookModal } from './AddBookModal';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  condition: string;
  category: string;
  price: number;
  status: 'available' | 'rented' | 'sold';
  listedDate: string;
}

export function BookInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'books'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookItem));
        setBooks(data);
      } catch (err) {
        toast.error('Failed to fetch books');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteDoc(doc(db, 'books', id));
        setBooks(books.filter(b => b.id !== id));
        toast.success('Book deleted');
      } catch (err) {
        toast.error('Failed to delete book');
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Book
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading books...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[#2C3E50]">{book.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">by {book.author}</p>
                </div>
                <Badge className={getStatusColor(book.status)}>
                  {book.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ISBN:</span>
                  <span className="text-[#2C3E50]">{book.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-[#2C3E50]">{book.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className="text-[#2C3E50]">{book.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="text-[#C4A672] text-lg">${book.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(book.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <AddBookModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}