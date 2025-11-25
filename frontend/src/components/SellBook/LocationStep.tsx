// Updated src/components/SellBook/LocationStep.tsx
import { useState } from 'react';
import { LocationData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { MapPin, Package, Truck, MapPinned } from 'lucide-react';

interface LocationStepProps {
  initialData: LocationData;
  onNext: (data: LocationData) => void;
  onBack: () => void;
}

export function LocationStep({ initialData, onNext, onBack }: LocationStepProps) {
  const [formData, setFormData] = useState<LocationData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [locating, setLocating] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate reverse geocoding
          setTimeout(() => {
            setFormData({
              ...formData,
              address: '123 Main Street',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            });
            setLocating(false);
          }, 1000);
        },
        (error) => {
          console.error('Error getting location:', error.message || 'Unknown error');
          let errorMessage = 'Unable to get your location. Please enter it manually.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please allow location access or enter your address manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please enter your address manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or enter your address manually.';
              break;
          }
          
          alert(errorMessage);
          setLocating(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter your address manually.');
      setLocating(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-[#C4A672]" />
        </div>
        <div>
          <h3 className="text-[#2C3E50]">Location & Delivery Options</h3>
          <p className="text-gray-600 text-sm">Help buyers find your book by sharing your location</p>
        </div>
      </div>

      {/* Delivery Method */}
      <div className="space-y-3">
        <Label>Delivery Method *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, method: 'pickup' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.method === 'pickup'
                ? 'border-[#C4A672] bg-[#C4A672]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Package className={`w-6 h-6 mx-auto mb-2 ${
              formData.method === 'pickup' ? 'text-[#C4A672]' : 'text-gray-400'
            }`} />
            <div className="text-center">
              <div className="text-sm">Local Pickup</div>
              <div className="text-xs text-gray-500 mt-1">Meet in person</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, method: 'shipping' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.method === 'shipping'
                ? 'border-[#C4A672] bg-[#C4A672]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Truck className={`w-6 h-6 mx-auto mb-2 ${
              formData.method === 'shipping' ? 'text-[#C4A672]' : 'text-gray-400'
            }`} />
            <div className="text-center">
              <div className="text-sm">Shipping Only</div>
              <div className="text-xs text-gray-500 mt-1">Ship to buyer</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, method: 'both' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.method === 'both'
                ? 'border-[#C4A672] bg-[#C4A672]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-center gap-1 mb-2">
              <Package className={`w-5 h-5 ${
                formData.method === 'both' ? 'text-[#C4A672]' : 'text-gray-400'
              }`} />
              <Truck className={`w-5 h-5 ${
                formData.method === 'both' ? 'text-[#C4A672]' : 'text-gray-400'
              }`} />
            </div>
            <div className="text-center">
              <div className="text-sm">Both Options</div>
              <div className="text-xs text-gray-500 mt-1">Most flexible</div>
            </div>
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label>Your Location *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            <MapPinned className="w-4 h-4 mr-2" />
            {locating ? 'Locating...' : 'Use Current Location'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main Street"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                setErrors({ ...errors, address: '' });
              }}
              className={errors.address ? 'border-red-500 bg-white' : 'bg-white'}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="San Francisco"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  setErrors({ ...errors, city: '' });
                }}
                className={errors.city ? 'border-red-500 bg-white' : 'bg-white'}
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                type="text"
                placeholder="CA"
                value={formData.state}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value });
                  setErrors({ ...errors, state: '' });
                }}
                className={errors.state ? 'border-red-500 bg-white' : 'bg-white'}
              />
              {errors.state && (
                <p className="text-sm text-red-500">{errors.state}</p>
              )}
            </div>
          </div>

          {/* ZIP Code */}
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="94102"
              value={formData.zipCode}
              onChange={(e) => {
                setFormData({ ...formData, zipCode: e.target.value });
                setErrors({ ...errors, zipCode: '' });
              }}
              className={errors.zipCode ? 'border-red-500 bg-white' : 'bg-white'}
            />
            {errors.zipCode && (
              <p className="text-sm text-red-500">{errors.zipCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Map preview will appear here</p>
          <p className="text-sm mt-1">
            {formData.city && formData.state 
              ? `${formData.city}, ${formData.state}` 
              : 'Enter your location to see map'}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Privacy Note:</strong> Your exact address will only be shared with buyers after a purchase is confirmed. For local pickups, we recommend meeting in a public place.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-6"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8"
        >
          Next: Review Details
        </Button>
      </div>
    </form>
  );
}