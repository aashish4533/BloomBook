import { useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, DollarSign, MapPin, Camera, Check } from 'lucide-react';
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

export function GiveBooksOnRent({ onClose, onSuccess }: GiveBooksOnRentProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    condition: '',
    description: '',
    rentalPeriod: '',
    pricePerWeek: '',
    securityDeposit: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    imageFiles: [] as File[]
  });

  const handleNext = () => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to submit listing');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Images to Cloudinary
      const imageUrls: string[] = [];
      if (formData.imageFiles && formData.imageFiles.length > 0) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          toast.error("Configuration error: Cloudinary credentials missing");
          return;
        }

        for (const file of formData.imageFiles) {
          try {
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
          } catch (uploadErr) {
            console.error("Error uploading file:", file.name, uploadErr);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      // 2. Prepare Data
      const listingData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        condition: formData.condition,
        description: formData.description,
        price: Number(formData.pricePerWeek),
        pricePerWeek: Number(formData.pricePerWeek),
        securityDeposit: Number(formData.securityDeposit),
        rentalPeriod: formData.rentalPeriod,
        images: imageUrls,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.pincode // Mapping pincode to zipCode for consistency
        },
        userId: user.uid,
        seller: {
          name: user.displayName || 'Anonymous',
          rating: 0,
          totalSales: 0,
          avatar: user.photoURL || ''
        },
        type: 'rent',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 3. Submit to Firestore
      await addDoc(collection(db, 'books'), listingData);

      toast.success('Book listed for rent successfully!');
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Failed to submit listing:', err);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeInUp">
        <Card className="bg-white rounded-xl shadow-hover max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl mb-3 text-gray-900">Book Listed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your book is now available for rent. We'll notify you when someone requests it.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl text-gray-900">Give Books on Rent</h1>
            <p className="text-sm text-gray-600">Earn money by renting out your books</p>
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

        {/* Step Content */}
        {currentStep === 'details' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Book Details
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
                          setFormData(prev => ({
                            ...prev,
                            imageFiles: Array.from(e.target.files || [])
                          }));
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
              <div>
                <Label htmlFor="pricePerWeek">Price Per Week (₹) *</Label>
                <Input
                  id="pricePerWeek"
                  type="number"
                  value={formData.pricePerWeek}
                  onChange={(e) => updateFormData('pricePerWeek', e.target.value)}
                  placeholder="e.g., 50"
                  className="mt-1 focus-glow"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Suggested: ₹30-100 per week based on book condition
                </p>
              </div>
              <div>
                <Label htmlFor="deposit">Security Deposit (₹) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => updateFormData('securityDeposit', e.target.value)}
                  placeholder="e.g., 200"
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
            <h2 className="text-xl mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Pickup Location
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="Street address"
                  className="mt-1 focus-glow"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="City"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
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
                    value={formData.pincode}
                    onChange={(e) => updateFormData('pincode', e.target.value)}
                    placeholder="PIN Code"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
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
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-sm text-gray-500 mb-2">Book Details</h3>
                <p className="text-gray-900">{formData.title || 'Not provided'}</p>
                <p className="text-sm text-gray-600">{formData.author || 'Author not provided'}</p>
                <p className="text-sm text-gray-600 mt-1">Condition: {formData.condition || 'Not selected'}</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="text-sm text-gray-500 mb-2">Pricing</h3>
                <p className="text-gray-900">₹{formData.pricePerWeek || '0'} per week</p>
                <p className="text-sm text-gray-600">Security Deposit: ₹{formData.securityDeposit || '0'}</p>
                <p className="text-sm text-gray-600">Max Period: {formData.rentalPeriod || 'Not selected'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-2">Pickup Location</h3>
                <p className="text-gray-900">{formData.address || 'Address not provided'}</p>
                <p className="text-sm text-gray-600">
                  {formData.city}, {formData.state} - {formData.pincode}
                </p>
                <p className="text-sm text-gray-600">Phone: {formData.phone}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale shadow-subtle"
          >
            {currentStep === 'review' ? 'List Book for Rent' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
