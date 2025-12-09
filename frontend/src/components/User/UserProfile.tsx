// Updated src/components/User/UserProfile.tsx
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { User, Mail, MapPin, CreditCard, Lock, Trash2, Save, Shield, ShoppingBag, DollarSign, Calendar, Heart, Users, MessageCircle, ArrowLeftRight, Gavel } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { db, auth } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDocument } from 'react-firebase-hooks/firestore';

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showAdminSwitchConfirm, setShowAdminSwitchConfirm] = useState(false);

  const user = auth.currentUser;
  const [value, loading, error] = useDocument(
    user ? doc(db, 'users', user.uid) : null,
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: ''
  });

  const { onPasswordChangeSuccess } = useOutletContext<{ onPasswordChangeSuccess: () => void }>() || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (value && value.exists()) {
      const data = value.data();
      setProfile(prev => ({
        ...prev,
        ...data,
        name: data.displayName || prev.name,
        email: auth.currentUser?.email || prev.email,
        phone: data.phoneNumber || data.personalInfo?.phoneNumber || data.phone || prev.phone,
        address: data.streetAddress || data.address || prev.address,
        state: data.state || prev.state
      }));
    } else if (auth.currentUser?.email) {
      setProfile(prev => ({ ...prev, email: auth.currentUser!.email! }));
    }
  }, [value, auth.currentUser]);

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profile,
        displayName: profile.name,
        personalInfo: {
          phoneNumber: profile.phone
        }, // Update nested object
        streetAddress: profile.address, // Save as streetAddress as requested implies distinction, but UI uses 'address'
        state: profile.state
      });
      setIsEditing(false);
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved.',
      });
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    }
  };

  const handleAdminSwitch = () => {
    setShowAdminSwitchConfirm(false);
    navigate('/admin/login');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const toastId = toast.loading('Fetching location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data.address) {
            const street = data.address.road || '';
            const houseNumber = data.address.house_number || '';
            const fullStreet = `${houseNumber} ${street}`.trim();

            setProfile((prev) => ({
              ...prev,
              address: fullStreet || prev.address,
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state || '',
              zipCode: data.address.postcode || '',
            }));
            toast.success('Location updated', { id: toastId });
          } else {
            toast.error('Could not determine address', { id: toastId });
          }
        } catch (error) {
          console.error('Error fetching address:', error);
          toast.error('Failed to fetching address', { id: toastId });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location: ' + error.message, { id: toastId });
      }
    );
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error loading profile: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-2xl">
              {profile.name ? profile.name.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-[#2C3E50] text-2xl">{profile.name || 'User'}</h2>
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">Member since 2024</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-green-600">Verified Account</span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => navigate('/dashboard/purchases')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900">Purchases</h3>
          <p className="text-xs text-gray-500">View history</p>
        </div>
        <div onClick={() => navigate('/dashboard/sales')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900">Sales</h3>
          <p className="text-xs text-gray-500">Track earnings</p>
        </div>
        <div onClick={() => navigate('/dashboard/rentals')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-medium text-gray-900">Rentals</h3>
          <p className="text-xs text-gray-500">Active & history</p>
        </div>
        <div onClick={() => navigate('/dashboard/wishlist')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-medium text-gray-900">Wishlist</h3>
          <p className="text-xs text-gray-500">Saved items</p>
        </div>
        <div onClick={() => navigate('/dashboard/communities')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900">Communities</h3>
          <p className="text-xs text-gray-500">Groups</p>
        </div>
        <div onClick={() => navigate('/dashboard/chats')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="font-medium text-gray-900">Chats</h3>
          <p className="text-xs text-gray-500">Messages</p>
        </div>
        <div onClick={() => navigate('/dashboard/exchanges')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-medium text-gray-900">Exchanges</h3>
          <p className="text-xs text-gray-500">Swap books</p>
        </div>
        <div onClick={() => navigate('/dashboard/negotiations')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Gavel className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="font-medium text-gray-900">Negotiations</h3>
          <p className="text-xs text-gray-500">Offers</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-[#2C3E50] mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={auth.currentUser?.email || profile.email}
              readOnly
              className="bg-gray-50"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-[#2C3E50] mb-6 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </div>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              type="button"
              className="text-xs"
            >
              Use Current Location
            </Button>
          )}
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={profile.zipCode}
              onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-[#2C3E50] mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Methods
        </h3>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-[#2C3E50]">Visa ending in 1234</p>
                <p className="text-sm text-gray-500">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
          <Button variant="outline" className="w-full">
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-[#2C3E50] mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Security & Access
        </h3>

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowChangePassword(true)}
            className="w-full justify-start hover:bg-[#FAF8F3] transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Separator />
          <Button
            variant="outline"
            onClick={() => setShowAdminSwitchConfirm(true)}
            className="w-full justify-start hover:bg-blue-50 border-blue-200 text-blue-700 transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            Login as Admin
          </Button>
          <Separator />
          <Button
            variant="outline"
            onClick={() => setShowDeleteAccount(true)}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}

      {/* Modals */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false);
            if (onPasswordChangeSuccess) {
              onPasswordChangeSuccess();
            }
          }}
        />
      )}
      {showDeleteAccount && (
        <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />
      )}

      {/* Admin Switch Confirmation Dialog */}
      <AlertDialog open={showAdminSwitchConfirm} onOpenChange={setShowAdminSwitchConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#2C3E50]">
              <Shield className="w-5 h-5 text-blue-600" />
              Switch to Admin Portal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              You are about to switch to the Admin Portal. You will be redirected to the admin login page.
              This action is only available to users with administrative privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-100">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminSwitch}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue to Admin Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}