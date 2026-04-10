import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { LocationData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { MapPin, Package, MapPinned } from 'lucide-react';

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
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  // Give GPS radios time on cold start (especially mobile).
  timeout: 35000,
};

/** Smaller = better; unknown / zero accuracy treated as weak so GPS can replace it. */
function effectiveAccuracyMeters(coords: GeolocationCoordinates): number {
  const a = coords.accuracy;
  if (!Number.isFinite(a) || a <= 0) return 9999;
  return a;
}

/**
 * Seeds with getCurrentPosition, then watchPosition for several seconds and keeps
 * the fix with the lowest reported uncertainty (typical on GPS vs first Wi‑Fi fix).
 * Resolves early if accuracy ≤ 10 m (good satellite lock).
 */
function getBestHighAccuracyPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    let best: GeolocationPosition | null = null;
    let bestScore = Infinity;
    let finished = false;
    let watchId = 0;
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

    const cleanup = () => {
      if (watchId !== 0) {
        navigator.geolocation.clearWatch(watchId);
        watchId = 0;
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const resolveOne = (pos: GeolocationPosition) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(pos);
    };

    const rejectOne = (err: GeolocationPositionError | Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(err);
    };

    const consider = (pos: GeolocationPosition) => {
      if (finished) return;
      const score = effectiveAccuracyMeters(pos.coords);
      if (!best || score < bestScore) {
        best = pos;
        bestScore = score;
      }
      if (score <= 10) {
        resolveOne(pos);
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => consider(pos),
      (err) => {
        if (err.code === 1 && !best) {
          rejectOne(err);
        }
      },
      GEO_OPTIONS
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => consider(pos),
      () => {},
      GEO_OPTIONS
    );

    const WATCH_MS = 22000;
    timeoutId = window.setTimeout(() => {
      if (finished) return;
      if (best) {
        resolveOne(best);
        return;
      }
      cleanup();
      navigator.geolocation.getCurrentPosition(
        (pos) => resolveOne(pos),
        (err) => rejectOne(err),
        GEO_OPTIONS
      );
    }, WATCH_MS);
  });
}

async function reverseGeocodeOpenStreetMap(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
  );
  return response.json();
}

export function LocationStep({ initialData, onNext, onBack }: LocationStepProps) {
  const [formData, setFormData] = useState<LocationData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [locating, setLocating] = useState(false);

  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const mapCenter: [number, number] = formData.coordinates
    ? [formData.coordinates.lat, formData.coordinates.lng]
    : defaultCenter;
  const mapZoom = formData.coordinates ? 18 : 12;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (formData.zipCode.trim().length < 3) {
      newErrors.zipCode = 'Please enter a valid postal code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    if (!window.isSecureContext) {
      toast.warning('Open this app over HTTPS', {
        description:
          'Browsers only expose precise location on a secure origin. Use https:// (the dev server now enables it) or production hosting with SSL.',
      });
    }

    setLocating(true);

    let latitude = 0;
    let longitude = 0;
    let accuracy = Infinity;

    try {
      const position = await getBestHighAccuracyPosition();
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      accuracy = position.coords.accuracy;

      try {
        const data = await reverseGeocodeOpenStreetMap(latitude, longitude);

        const addressParts = data.address || {};
        const street = [addressParts.house_number, addressParts.road].filter(Boolean).join(' ').trim();
        const city =
          addressParts.city ||
          addressParts.town ||
          addressParts.village ||
          addressParts.hamlet ||
          addressParts.suburb ||
          addressParts.neighbourhood ||
          addressParts.municipality ||
          addressParts.county ||
          '';
        const state =
          addressParts.state ||
          addressParts.region ||
          addressParts.state_district ||
          '';

        setFormData((prev) => ({
          ...prev,
          method: 'pickup',
          address: street || data.display_name?.split(',').slice(0, 2).join(', ').trim() || 'Detected location',
          city,
          state,
          zipCode: addressParts.postcode || '',
          coordinates: { lat: latitude, lng: longitude },
        }));

        setErrors({});

        if (Number.isFinite(accuracy) && accuracy > 25) {
          toast.message('Location can be more precise', {
            description:
              'Use HTTPS, allow location + Precise/Exact location for this site (browser site settings), wait a few seconds on first lock, or move near a window/outdoors and tap again.',
          });
        }
      } catch (error) {
        console.error('Reverse geocoding failed', error);
        setFormData((prev) => ({
          ...prev,
          method: 'pickup',
          coordinates: { lat: latitude, lng: longitude },
        }));
        toast.error('Could not resolve address from coordinates. Enter your street details manually.');
      }
    } catch (error: unknown) {
      console.error('Error getting location:', error);
      let errorMessage = 'Unable to get your location.';
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as GeolocationPositionError).code;
        if (code === 1) {
          errorMessage =
            'Location permission denied. Allow location and Precise/Exact location for this site in your browser settings.';
        } else if (code === 2) {
          errorMessage = 'Position unavailable. Check GPS/network or try again outdoors.';
        } else if (code === 3) {
          errorMessage = 'Location request timed out. Try again—first GPS lock can take longer.';
        }
      }
      toast.error(errorMessage);
    } finally {
      setLocating(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({ ...formData, method: 'pickup' });
    } else {
      toast.error('Please fill in all required location fields correctly.');
      console.warn('Validation failed. Missing fields in formData.');
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-[#C4A672]" />
        </div>
        <div>
          <h3 className="text-[#2C3E50]">Pickup location</h3>
          <p className="text-gray-600 text-sm">Buyers will meet you locally to collect the book</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-[#C4A672]/30 bg-[#C4A672]/5 p-4">
        <Package className="w-5 h-5 text-[#C4A672] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#2C3E50]">Local pickup only</p>
          <p className="text-xs text-gray-600 mt-1">Listings use in-person pickup. Share an accurate meeting address.</p>
        </div>
      </div>

      {/* Location Inputs Section */}
      <div className="space-y-4 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label>Your Location *</Label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="address">Street Address *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                title="Samples GPS for up to ~22s and uses the most accurate reading (enable Precise location in browser settings)"
                className="h-8 text-xs bg-[#C4A672]/10 text-[#C4A672] hover:bg-[#C4A672]/20 border-[#C4A672]/30"
              >
                <MapPinned className="w-3 h-3 mr-1" />
                {locating ? 'Locating…' : 'Use current location'}
              </Button>
            </div>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={errors.address ? 'border-red-500 bg-white' : 'bg-white'}
              placeholder="Enter street address"
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
            <p className="text-xs text-gray-500 leading-snug">
              Best accuracy: open the site with <strong className="text-gray-700">https://</strong>, allow location, turn on{' '}
              <strong className="text-gray-700">Precise location</strong> for this site (address bar lock icon → site settings → Location), then try again near a window or outdoors.
            </p>
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
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
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