<<<<<<< HEAD
// Updated src/components/Communities/CreatePost.tsx
=======
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
import { useState } from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
import { toast } from 'sonner@2.0.3';
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249

interface CreatePostProps {
  onClose: () => void;
  onSubmit: (content: string, images: string[]) => void;
}

export function CreatePost({ onClose, onSubmit }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_CHARS = 5000;
  const MAX_IMAGES = 4;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    if (content.length > MAX_CHARS) {
      toast.error(`Post is too long (max ${MAX_CHARS} characters)`);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      onSubmit(content, images);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl text-[#2C3E50]">Create Post</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Text Input */}
          <div className="mb-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or recommendations..."
              rows={8}
              className="resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${
                content.length > MAX_CHARS ? 'text-red-500' : 'text-gray-500'
              }`}>
                {content.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {images.length < MAX_IMAGES && (
<<<<<<< HEAD
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#C4A672] transition-colors cursor-pointer mb-4">
=======
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#C4A672] transition-colors cursor-pointer">
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">Add images to your post</p>
              <p className="text-sm text-gray-500">
                {images.length}/{MAX_IMAGES} images • Max 5MB each
              </p>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || content.length > MAX_CHARS || isSubmitting}
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
