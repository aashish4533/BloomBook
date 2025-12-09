import { useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, DollarSign, MapPin, Camera, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface GiveBooksOnRentProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'details' | 'pricing' | 'location' | 'review' | 'success';

interface BookData {
  title: string;
  author: string;
  isbn: string;
  condition: string;
  description: string;
  rentalPeriod: string;
  pricePerWeek: string;
  securityDeposit: string;
  originalPrice: string;
  imageFiles: File[];
}

export function GiveBooksOnRent({ onClose, onSuccess }: GiveBooksOnRentProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [addedBooks, setAddedBooks] = useState<BookData[]>([]);

  // Current book form data
  const [formData, setFormData] = useState<BookData>({
    title: '',
    author: '',
    isbn: '',
    condition: '',
    description: '',
    rentalPeriod: '',
    pricePerWeek: '',
    securityDeposit: '',
    originalPrice: '',
    imageFiles: []
  });

  // Common location data (applies to all books)
  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  const handleNext = () => {
    if (currentStep === 'pricing') {
      // Validate Pricing
      const original = parseFloat(formData.originalPrice);
      const rent = parseFloat(formData.pricePerWeek);

      if (!original || !rent) {
        toast.error('Please enter valid prices');
        return;
      }

      const minPrice = original * 0.01;
      const maxPrice = original * 0.03;

      if (rent <= minPrice || rent >= maxPrice) {
        toast.error(`Rent price must be between Rs. ${minPrice.toFixed(0)} (1%) and Rs. ${maxPrice.toFixed(0)} (3%) of Original Price`);
        return;
      }
    }

    const steps: Step[] = ['details', 'pricing', 'location', 'review', 'success'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['details', 'pricing', 'location', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      onClose();
    }
  };

  const handleAddAnother = () => {
    if (addedBooks.length + 1 >= 4) {
      toast.error('Maximum 4 books allowed');
      return;
    }
    setAddedBooks([...addedBooks, formData]);
    // Reset form for next book
    setFormData({
      title: '',
      author: '',
      isbn: '',
      condition: '',
      description: '',
      rentalPeriod: '',
      pricePerWeek: '',
      securityDeposit: '',
      originalPrice: '',
      imageFiles: []
    });
    setCurrentStep('details');
    toast.success('Book added! Enter details for the next book.');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to submit listing');
      return;
    }

    setIsSubmitting(true);

    try {
      const allBooks = [...addedBooks, formData];
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        toast.error("Configuration error: Cloudinary credentials missing");
        return;
      }

      // Process each book
      for (const book of allBooks) {
        // Upload images
        const imageUrls: string[] = [];
        if (book.imageFiles && book.imageFiles.length > 0) {
          for (const file of book.imageFiles) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('upload_preset', uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: uploadFormData
            });

            if (!response.ok) throw new Error('Image upload failed');
            const data = await response.json();
            imageUrls.push(data.secure_url);
          }
        }

        const listingData = {
          ...book,
          price: Number(book.pricePerWeek),
          pricePerWeek: Number(book.pricePerWeek),
          securityDeposit: Number(book.securityDeposit),
          originalPrice: Number(book.originalPrice),
          images: imageUrls,
          location: {
            address: locationData.address,
            city: locationData.city,
            state: locationData.state,
            zipCode: locationData.pincode
          },
          contactPhone: locationData.phone,
          userId: user.uid,
          seller: {
            name: user.displayName || 'Anonymous',
            rating: 0,
            totalSales: 0,
            avatar: user.photoURL || ''
          },
          type: 'rent',
          availableFor: ['rent'], // Explicitly set availableFor as requested
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'books'), listingData);
      }

      toast.success('Books listed for rent successfully!');
      setCurrentStep('success');

      // Auto redirect after 4 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onClose();
      }, 4000);

    } catch (err: any) {
      console.error('Failed to submit listing:', err);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof BookData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateLocationData = (field: string, value: string) => {
    setLocationData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }
    const toastId = toast.loading('Fetching location...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data.address) {
          const street = data.address.road || '';
          const house = data.address.house_number || '';
          updateLocationData('address', `${house} ${street}`.trim());
          updateLocationData('city', data.address.city || data.address.town || '');
          updateLocationData('state', data.address.state || '');
          updateLocationData('pincode', data.address.postcode || '');
          toast.success('Location updated', { id: toastId });
        }
      } catch (e) {
        toast.error('Failed to fetch address', { id: toastId });
      }
    }, (err) => {
      toast.error('Location error: ' + err.message, { id: toastId });
    });
  };

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeInUp">
        <Card className="bg-white rounded-xl shadow-hover max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl mb-3 text-gray-900">Listings Created!</h2>
          <p className="text-gray-600 mb-4">
            Your books are now available for rent. Redirecting...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack} className="hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl text-gray-900">Give Books on Rent</h1>
            <p className="text-sm text-gray-600">
              {addedBooks.length > 0 ? `Book ${addedBooks.length + 1} of 4` : 'Earn money by renting out your books'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Details', 'Pricing', 'Location', 'Review'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-smooth ${['details', 'pricing', 'location', 'review'].indexOf(currentStep) >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-smooth ${['details', 'pricing', 'location', 'review'].indexOf(currentStep) > index
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 'details' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Book Details {addedBooks.length > 0 && `(${addedBooks.length + 1}/4)`}
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter book title"
                  className="mt-1 focus-glow"
                />
              </div>
              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => updateFormData('author', e.target.value)}
                  placeholder="Enter author name"
                  className="mt-1 focus-glow"
                />
              </div>
              <div>
                <Label htmlFor="isbn">ISBN (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => updateFormData('isbn', e.target.value)}
                    placeholder="Enter ISBN or scan"
                    className="focus-glow"
                  />
                  <Button variant="outline" className="hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="condition">Book Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: string) => updateFormData('condition', value)}
                >
                  <SelectTrigger className="mt-1 focus-glow">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Like New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Add any additional details about the book..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="images">Book Images *</Label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          updateFormData('imageFiles', Array.from(e.target.files));
                        }
                      }}
                      className="focus-glow"
                    />
                  </div>
                  {formData.imageFiles && formData.imageFiles.length > 0 && (
                    <span className="text-sm text-green-600">
                      {formData.imageFiles.length} file(s) selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'pricing' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              Rental Pricing
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period">Maximum Rental Period</Label>
                <Select
                  value={formData.rentalPeriod}
                  onValueChange={(value: string) => updateFormData('rentalPeriod', value)}
                >
                  <SelectTrigger className="mt-1 focus-glow">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="2weeks">2 Weeks</SelectItem>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="2months">2 Months</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="originalPrice">Original Price (PKR) *</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => updateFormData('originalPrice', e.target.value)}
                    placeholder="e.g., 2000"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerWeek">Price Per Week (PKR) *</Label>
                  <Input
                    id="pricePerWeek"
                    type="number"
                    value={formData.pricePerWeek}
                    onChange={(e) => updateFormData('pricePerWeek', e.target.value)}
                    placeholder="e.g., 50"
                    className="mt-1 focus-glow"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Rent must be between 1% and 3% of Original Price.
              </p>
              <div>
                <Label htmlFor="deposit">Security Deposit (PKR) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => updateFormData('securityDeposit', e.target.value)}
                  placeholder="e.g., 1500"
                  className="mt-1 focus-glow"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Refundable deposit to protect against damage
                </p>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'location' && (
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Pickup Location
              </h2>
              <Button variant="outline" size="sm" onClick={handleUseCurrentLocation} type="button">
                <MapPin className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={locationData.address}
                  onChange={(e) => updateLocationData('address', e.target.value)}
                  placeholder="Street address"
                  className="mt-1 focus-glow"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={locationData.city}
                    onChange={(e) => updateLocationData('city', e.target.value)}
                    placeholder="City"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={locationData.state}
                    onChange={(e) => updateLocationData('state', e.target.value)}
                    placeholder="State"
                    className="mt-1 focus-glow"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={locationData.pincode}
                    onChange={(e) => updateLocationData('pincode', e.target.value)}
                    placeholder="PIN Code"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={locationData.phone}
                    onChange={(e) => updateLocationData('phone', e.target.value)}
                    placeholder="Contact number"
                    className="mt-1 focus-glow"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'review' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-6">Review Your Listing</h2>

            {/* Added Books */}
            {addedBooks.map((book, idx) => (
              <div key={idx} className="mb-6 p-4 border rounded-lg bg-gray-50 relative">
                <h3 className="font-medium text-lg mb-2">Book {idx + 1}: {book.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <p>Author: {book.author}</p>
                  <p>Condition: {book.condition}</p>
                  <p>Price/Week: Rs. {book.pricePerWeek}</p>
                  <p>Deposit: Rs. {book.securityDeposit}</p>
                </div>
              </div>
            ))}

            {/* Current Book */}
            <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-100">
              <h3 className="font-medium text-lg mb-2 text-blue-900">Current Book: {formData.title || 'Untitled'}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <p>Author: {formData.author}</p>
                <p>Condition: {formData.condition}</p>
                <p>Price/Week: Rs. {formData.pricePerWeek}</p>
                <p>Deposit: Rs. {formData.securityDeposit}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm text-gray-500 mb-2">Pickup Location (All Books)</h3>
              <p className="text-gray-900">{locationData.address || 'Address not provided'}</p>
              <p className="text-sm text-gray-600">
                {locationData.city}, {locationData.state} - {locationData.pincode}
              </p>
              <p className="text-sm text-gray-600">Phone: {locationData.phone}</p>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={handleAddAnother}
                disabled={addedBooks.length >= 3}
                className="w-full border-dashed border-2 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addedBooks.length >= 3 ? 'Max books reached' : 'Add Another Book'}
              </Button>
            </div>

          </Card>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 hover:bg-gray-50 transition-smooth"
          >
            Back
          </Button>
          <Button
            onClick={currentStep === 'review' ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale shadow-subtle"
          >
            {isSubmitting ? 'Listing...' : (currentStep === 'review' ? `List ${addedBooks.length + 1} Book(s)` : 'Continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
