// Updated src/components/Admin/AnnouncementForm.tsx
import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

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

interface AnnouncementFormProps {
  announcement?: Announcement | null;
  onClose: () => void;
  onSave: (data: Omit<Announcement, 'id' | 'views'>) => void;
}

export function AnnouncementForm({ announcement, onClose, onSave }: AnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'info' as 'info' | 'promo' | 'update',
    image: announcement?.image || null as string | null,
    date: announcement?.date || new Date(),
    published: announcement?.published ?? true
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    } else if (formData.content.length > 2000) {
      newErrors.content = 'Content must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSave = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        image: formData.image,
        date: formData.date,
        published: formData.published,
        views: announcement?.views || 0
      };

      if (announcement) {
        await setDoc(doc(db, 'announcements', announcement.id), dataToSave);
        toast.success('Announcement updated');
      } else {
        await addDoc(collection(db, 'announcements'), dataToSave);
        toast.success('Announcement created');
      }
      onClose();
    } catch (err) {
      toast.error('Failed to save announcement');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (announcement && confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteDoc(doc(db, 'announcements', announcement.id));
        toast.success('Announcement deleted');
        onClose();
      } catch (err) {
        toast.error('Failed to delete announcement');
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl text-[#2C3E50]">
            {announcement ? 'Edit Announcement' : 'Create Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-[#2C3E50] mb-2">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="e.g., New Feature Launch!"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Type */}
          <div>
            <Label className="text-[#2C3E50] mb-2">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'info' | 'promo' | 'update') =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info - General information</SelectItem>
                <SelectItem value="promo">🎁 Promo - Special offers & deals</SelectItem>
                <SelectItem value="update">✨ Update - Platform updates & features</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-[#2C3E50] mb-2">
              Content *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, content: e.target.value }));
                setErrors(prev => ({ ...prev, content: '' }));
              }}
              placeholder="Write the announcement content..."
              rows={6}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {formData.content.length}/2000 characters
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-[#2C3E50] mb-2">Cover Image (Optional)</Label>
            
            {formData.image ? (
              <div className="relative">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="block w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#C4A672] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Upload className="w-12 h-12 mb-3" />
                  <p className="text-center">Click to upload a cover image</p>
                  <p className="text-xs mt-1">Recommended: 1200x400px, Max 5MB</p>
                </div>
              </label>
            )}
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-[#2C3E50] mb-2">
              Publication Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))
              }
            />
          </div>

          {/* Published Status */}
          <div className="flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              checked={formData.published}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, published: e.target.checked }))
              }
              className="w-5 h-5 text-[#C4A672] border-gray-300 rounded focus:ring-[#C4A672]"
            />
            <Label htmlFor="published" className="text-[#2C3E50] cursor-pointer">
              Publish immediately (uncheck to save as draft)
            </Label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm text-gray-700 mb-2">Preview:</h4>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {formData.type === 'info' && 'ℹ️'}
                  {formData.type === 'promo' && '🎁'}
                  {formData.type === 'update' && '✨'}
                </span>
                <span className="text-sm text-gray-500">
                  {formData.date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <h3 className="text-xl text-[#2C3E50] mb-2">
                {formData.title || 'Announcement Title'}
              </h3>
              <p className="text-gray-700">
                {formData.content || 'Announcement content will appear here...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {announcement && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  Delete Announcement
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Saving...'
                  : announcement
                  ? 'Update'
                  : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}