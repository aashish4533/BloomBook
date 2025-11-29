import { useState, useEffect } from 'react';
import { LocationData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { MapPin, Package, Truck, MapPinned } from 'lucide-react';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. Define Red Pointer Icon ---
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationStepProps {
  initialData: LocationData;
  onNext: (data: LocationData) => void;
  onBack: () => void;
}

// Helper to auto-center map when coordinates update
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

  // Default view (San Francisco) if no location set
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const mapCenter: [number, number] = formData.coordinates 
    ? [formData.coordinates.lat, formData.coordinates.lng] 
    : defaultCenter;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 2. Updated Handler to Fetch & Fill Data ---
  const handleUseCurrentLocation = () => {
    setLocating(true);
    
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // REAL API CALL: OpenStreetMap Reverse Geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) throw new Error('Location fetch failed');
          
          const data = await response.json();
          const addr = data.address || {};

          // Map API fields to our form fields
          setFormData(prev => ({
            ...prev,
            address: `${addr.house_number || ''} ${addr.road || ''}`.trim() || prev.address,
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            zipCode: addr.postcode || '',
            coordinates: {
              lat: latitude,
              lng: longitude
            }
          }));
        } catch (error) {
          console.error("Geocoding error:", error);
          // Fallback: Set coordinates even if address fetch fails
          setFormData(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude }
          }));
          alert('Location found, but address details could not be fetched automatically.');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        alert('Unable to retrieve your location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onNext(formData);
  };

  return (
    <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-[#C4A672]" />
        </div>
        <div>
          <h3 className="text-[#2C3E50]">Location & Delivery Options</h3>
          <p className="text-gray-600 text-sm">Help buyers find your book</p>
        </div>
      </div>

      {/* Delivery Method Toggles */}
      <div className="space-y-3">
        <Label>Delivery Method *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, method: 'pickup' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.method === 'pickup' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
            }`}
          >
            <Package className={`w-6 h-6 mx-auto mb-2 ${
              formData.method === 'pickup' ? 'text-[#C4A672]' : 'text-gray-400'
            }`} />
            <div className="text-center text-sm">Local Pickup</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, method: 'shipping' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.method === 'shipping' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
            }`}
          >
            <Truck className={`w-6 h-6 mx-auto mb-2 ${
              formData.method === 'shipping' ? 'text-[#C4A672]' : 'text-gray-400'
            }`} />
            <div className="text-center text-sm">Shipping Only</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, method: 'both' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.method === 'both' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-center gap-1 mb-2">
              <Package className={`w-5 h-5 ${formData.method === 'both' ? 'text-[#C4A672]' : 'text-gray-400'}`} />
              <Truck className={`w-5 h-5 ${formData.method === 'both' ? 'text-[#C4A672]' : 'text-gray-400'}`} />
            </div>
            <div className="text-center text-sm">Both Options</div>
          </button>
        </div>
      </div>

      {/* Location Fields */}
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
            {locating ? 'Detecting...' : 'Use Current Location'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-white"
              placeholder="123 Main St"
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
                className="bg-white"
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="bg-white"
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
              className="bg-white"
            />
            {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode}</p>}
          </div>
        </div>
      </div>

      {/* Map Container */}
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
            <Marker 
              position={[formData.coordinates.lat, formData.coordinates.lng]} 
              icon={redIcon}
            >
              <Popup>
                {formData.address || "Selected Location"}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit" className="bg-[#C4A672] hover:bg-[#8B7355] text-white">Next: Review</Button>
      </div>
    </form>
  );
}