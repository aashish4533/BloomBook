// Updated src/components/Communities/CreateCommunity.tsx
import { useState } from 'react';
import { ArrowLeft, Upload, X, Globe, Lock, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CreateCommunityProps {
  onBack: () => void;
  onSuccess: (communityId: string) => void;
  userId: string;
  userName: string;
}

export function CreateCommunity({ onBack, onSuccess, userId, userName }: CreateCommunityProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private',
    topic: '',
    location: '',
    image: null as string | null
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const topics = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Romance', 'Thriller', 'Horror', 'Biography', 'History',
    'Science', 'Technology', 'Business', 'Self-Help', 'Art',
    'Poetry', 'Drama', 'Education', 'Religion', 'Philosophy'
  ];

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) {
      newErrors.name = 'Community name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (selectedTopics.length === 0) {
      newErrors.topics = 'Please select at least one topic';
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

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
    setErrors(prev => ({ ...prev, topics: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const newCommunity = await addDoc(collection(db, 'communities'), {
        name: formData.name,
        description: formData.description,
        privacy: formData.privacy,
        topics: selectedTopics,
        location: formData.location,
        image: formData.image,
        adminId: userId,
        adminName: userName,
        memberCount: 1,
        postsCount: 0,
        createdAt: serverTimestamp()
      });

      // Add creator as member
      await updateDoc(newCommunity, {
        members: arrayUnion(userId)
      });

      toast.success('Community created successfully! You are now the admin.');
      onSuccess(newCommunity.id);
    } catch (err) {
      toast.error('Failed to create community');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Communities
          </button>
          <h1 className="text-4xl mb-2">Create a Community</h1>
          <p className="text-white/90">Build a space for readers to connect and discuss</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Community Name */}
          <div className="mb-6">
            <Label htmlFor="name" className="text-[#2C3E50] mb-2">
              Community Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Science Fiction Lovers"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <Label htmlFor="description" className="text-[#2C3E50] mb-2">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="Describe what your community is about, what members can expect, and any rules..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Privacy Settings */}
          <div className="mb-6">
            <Label className="text-[#2C3E50] mb-3">Privacy Settings *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, privacy: 'public' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.privacy === 'public'
                    ? 'border-[#C4A672] bg-[#C4A672]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-[#C4A672] flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#2C3E50]">Public</span>
                      {formData.privacy === 'public' && (
                        <Check className="w-4 h-4 text-[#C4A672]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Anyone can join immediately. Community is visible to everyone.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, privacy: 'private' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.privacy === 'private'
                    ? 'border-[#C4A672] bg-[#C4A672]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-[#C4A672] flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#2C3E50]">Private</span>
                      {formData.privacy === 'private' && (
                        <Check className="w-4 h-4 text-[#C4A672]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Admin approval required to join. More control over membership.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Topic Tags */}
          <div className="mb-6">
            <Label className="text-[#2C3E50] mb-3">Topic Tags * (Select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedTopics.includes(topic)
                      ? 'bg-[#C4A672] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {topic}
                  {selectedTopics.includes(topic) && (
                    <X className="w-3 h-3 ml-2 inline" />
                  )}
                </button>
              ))}
            </div>
            {errors.topics && (
              <p className="text-sm text-red-500 mt-2">{errors.topics}</p>
            )}
            {selectedTopics.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedTopics.join(', ')}
              </p>
            )}
          </div>

          {/* Location (Optional) */}
          <div className="mb-6">
            <Label htmlFor="location" className="text-[#2C3E50] mb-2">
              Location (Optional)
            </Label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., San Francisco, CA or 'Online'"
            />
            <p className="text-sm text-gray-500 mt-1">
              Specify a location if your community has local meetups
            </p>
          </div>

          {/* Community Image */}
          <div className="mb-8">
            <Label className="text-[#2C3E50] mb-2">Community Image (Optional)</Label>
            
            {formData.image ? (
              <div className="relative">
                <img
                  src={formData.image}
                  alt="Community preview"
                  className="w-full h-48 object-cover rounded-lg"
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
              <label className="block w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#C4A672] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Upload className="w-12 h-12 mb-3" />
                  <p className="text-sm">Click to upload an image</p>
                  <p className="text-xs mt-1">Max size: 5MB</p>
                </div>
              </label>
            )}
          </div>

          {/* Admin Info */}
          <div className="bg-[#C4A672]/10 border border-[#C4A672]/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#2C3E50]">
              <strong>You will be assigned as the admin</strong> of this community. As admin, you can:
            </p>
            <ul className="text-sm text-gray-700 mt-2 ml-4 list-disc space-y-1">
              <li>Approve or reject join requests (for private communities)</li>
              <li>Manage members (remove members if needed)</li>
              <li>Moderate posts and comments</li>
              <li>Edit community details</li>
              <li>Delete the community</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Community'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}