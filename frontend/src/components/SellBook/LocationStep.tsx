import { useState, useEffect } from 'react';
import { LocationData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { MapPin, Package, Truck, MapPinned } from 'lucide-react';

// 1. Import Leaflet and React-Leaflet components
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 2. Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationStepProps {
  initialData: LocationData;
  onNext: (data: LocationData) => void;
  onBack: () => void;
}

// 3. Helper component to recenter map when coordinates change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function LocationStep({ initialData, onNext, onBack }: LocationStepProps) {
  const [formData, setFormData] = useState<LocationData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [locating, setLocating] = useState(false);
  
  // Default center (San Francisco) if no coordinates provided
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const mapCenter: [number, number] = formData.coordinates 
    ? [formData.coordinates.lat, formData.coordinates.lng] 
    : defaultCenter;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // FETCH IMPLEMENTATION: OpenStreetMap Nominatim API
            // This fetches address details based on the lat/long
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            const addressParts = data.address || {};
            
            // Construct fields from API response
            const street = [addressParts.house_number, addressParts.road].filter(Boolean).join(' ');
            const city = addressParts.city || addressParts.town || addressParts.village || addressParts.hamlet || '';

            setFormData({
              ...formData,
              address: street || 'Detected Location', // Fallback if road isn't found
              city: city,
              state: addressParts.state || '',
              zipCode: addressParts.postcode || '',
              coordinates: {
                lat: latitude,
                lng: longitude
              }
            });
            
            // Clear any previous errors
            setErrors({});
            
          } catch (error) {
            console.error("Reverse geocoding failed", error);
            // Fallback: If API fails, at least update the map coordinates
            setFormData(prev => ({
              ...prev,
              coordinates: { lat: latitude, lng: longitude }
            }));
            alert('Location found, but could not retrieve address details automatically.');
          } finally {
            setLocating(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error.message);
          let errorMessage = 'Unable to get your location.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied. Please enable it in your browser settings.';
          }
          alert(errorMessage);
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
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

      {/* Delivery Method Selection (Unchanged) */}
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

      {/* Location Inputs Section */}
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
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={errors.address ? 'border-red-500 bg-white' : 'bg-white'}
              placeholder="Enter street address"
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={errors.city ? 'border-red-500 bg-white' : 'bg-white'}
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={errors.state ? 'border-red-500 bg-white' : 'bg-white'}
              />
              {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              className={errors.zipCode ? 'border-red-500 bg-white' : 'bg-white'}
            />
            {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode}</p>}
          </div>
        </div>
      </div>

      {/* REAL MAP IMPLEMENTATION */}
      <div className="h-64 rounded-lg overflow-hidden border border-gray-300 z-0 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          {formData.coordinates && (
            <Marker position={[formData.coordinates.lat, formData.coordinates.lng]}>
              <Popup>
                {formData.address || "Your Location"}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Privacy Note:</strong> Your exact address will only be shared with buyers after purchase.
        </p>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button type="button" variant="outline" onClick={onBack} className="px-6">Back</Button>
        <Button type="submit" className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8">Next: Review</Button>
      </div>
    </form>
  );
}