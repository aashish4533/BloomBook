// Updated src/components/Admin/SystemSettings.tsx
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Save, Bell, DollarSign, Shield } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export function SystemSettings() {
  const [settings, setSettings] = useState({
    // Pricing
    platformFeePercentage: 10,
    minBookPrice: 1.00,
    maxBookPrice: 500.00,
    defaultRentalDuration: 30,

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    overdueReminders: true,
    newListingAlerts: true,

    // Security
    requireEmailVerification: true,
    twoFactorForAdmins: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'system');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err: any) {
        console.error("Settings fetch error:", err);
        if (err.code === 'permission-denied') {
          toast.error('Permission denied. Please check your admin privileges or Firestore rules.');
        } else {
          toast.error(`Failed to fetch settings: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'system'), settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
      console.error(err);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#C4A672]" />
          </div>
          <div>
            <h3 className="text-[#2C3E50]">Pricing Rules</h3>
            <p className="text-sm text-gray-600">Configure platform fees and pricing limits</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="platformFee">Platform Fee (%)</Label>
            <Input
              id="platformFee"
              type="number"
              value={settings.platformFeePercentage}
              onChange={(e) => setSettings({
                ...settings,
                platformFeePercentage: parseFloat(e.target.value)
              })}
            />
            <p className="text-xs text-gray-500">Fee charged on each transaction</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentalDuration">Default Rental Duration (days)</Label>
            <Input
              id="rentalDuration"
              type="number"
              value={settings.defaultRentalDuration}
              onChange={(e) => setSettings({
                ...settings,
                defaultRentalDuration: parseInt(e.target.value)
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minPrice">Minimum Book Price (Rs.)</Label>
            <Input
              id="minPrice"
              type="number"
              step="0.01"
              value={settings.minBookPrice}
              onChange={(e) => setSettings({
                ...settings,
                minBookPrice: parseFloat(e.target.value)
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Maximum Book Price (Rs.)</Label>
            <Input
              id="maxPrice"
              type="number"
              step="0.01"
              value={settings.maxBookPrice}
              onChange={(e) => setSettings({
                ...settings,
                maxBookPrice: parseFloat(e.target.value)
              })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[#2C3E50]">Notification Settings</h3>
            <p className="text-sm text-gray-600">Manage system notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotif">Email Notifications</Label>
              <p className="text-sm text-gray-500">Send notifications via email</p>
            </div>
            <Switch
              id="emailNotif"
              checked={settings.emailNotifications}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                emailNotifications: checked
              })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="smsNotif">SMS Notifications</Label>
              <p className="text-sm text-gray-500">Send notifications via SMS</p>
            </div>
            <Switch
              id="smsNotif"
              checked={settings.smsNotifications}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                smsNotifications: checked
              })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="overdueNotif">Overdue Reminders</Label>
              <p className="text-sm text-gray-500">Automatic reminders for overdue rentals</p>
            </div>
            <Switch
              id="overdueNotif"
              checked={settings.overdueReminders}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                overdueReminders: checked
              })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="newListingNotif">New Listing Alerts</Label>
              <p className="text-sm text-gray-500">Notify users of new book listings</p>
            </div>
            <Switch
              id="newListingNotif"
              checked={settings.newListingAlerts}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                newListingAlerts: checked
              })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-[#2C3E50]">Security Settings</h3>
            <p className="text-sm text-gray-600">Configure security and authentication</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailVerif">Require Email Verification</Label>
              <p className="text-sm text-gray-500">Users must verify email to use platform</p>
            </div>
            <Switch
              id="emailVerif"
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                requireEmailVerification: checked
              })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactor">Two-Factor Auth for Admins</Label>
              <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
            </div>
            <Switch
              id="twoFactor"
              checked={settings.twoFactorForAdmins}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                twoFactorForAdmins: checked
              })}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  sessionTimeout: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Login Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({
                  ...settings,
                  maxLoginAttempts: parseInt(e.target.value)
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}