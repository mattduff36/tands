'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  PoundSterling,
  Shield,
  Bell,
  Globe,
  Database,
  Key
} from 'lucide-react';

interface SettingsData {
  business: {
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
  };
  pricing: {
    baseRate: number;
    hourlyRate: number;
    deliveryFee: number;
    setupFee: number;
  };
  operational: {
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
    bookingNotice: number;
    maxBookingDays: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    bookingReminders: boolean;
    paymentReminders: boolean;
  };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mock settings data
  useEffect(() => {
    const mockSettings: SettingsData = {
      business: {
        name: 'T&S Bouncy Castles',
        email: 'info@tandsbouncycastles.co.uk',
        phone: '+44 20 1234 5678',
        address: '123 Business Street, London, UK',
        description: 'Premium bouncy castle hire services across London. Safe, clean, and fun entertainment for all ages.'
      },
      pricing: {
        baseRate: 150,
        hourlyRate: 25,
        deliveryFee: 50,
        setupFee: 25
      },
      operational: {
        workingHours: {
          start: '08:00',
          end: '18:00'
        },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        bookingNotice: 48,
        maxBookingDays: 90
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        bookingReminders: true,
        paymentReminders: true
      }
    };

    setTimeout(() => {
      setSettings(mockSettings);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    // Show success message (would integrate with toast/notification system)
    console.log('Settings saved successfully');
  };

  const updateSettings = (section: keyof SettingsData, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const updateNestedSettings = (section: keyof SettingsData, nested: string, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [nested]: {
          ...(prev![section] as any)[nested],
          [field]: value
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your business settings and preferences
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={settings?.business.name || ''}
                onChange={(e) => updateSettings('business', 'name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessEmail">Email Address</Label>
              <Input
                id="businessEmail"
                type="email"
                value={settings?.business.email || ''}
                onChange={(e) => updateSettings('business', 'email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessPhone">Phone Number</Label>
              <Input
                id="businessPhone"
                value={settings?.business.phone || ''}
                onChange={(e) => updateSettings('business', 'phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessAddress">Address</Label>
              <Textarea
                id="businessAddress"
                value={settings?.business.address || ''}
                onChange={(e) => updateSettings('business', 'address', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">Description</Label>
              <Textarea
                id="businessDescription"
                value={settings?.business.description || ''}
                onChange={(e) => updateSettings('business', 'description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PoundSterling className="w-5 h-5 mr-2" />
              Pricing Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="baseRate">Base Rate (£)</Label>
              <Input
                id="baseRate"
                type="number"
                value={settings?.pricing.baseRate || 0}
                onChange={(e) => updateSettings('pricing', 'baseRate', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (£)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={settings?.pricing.hourlyRate || 0}
                onChange={(e) => updateSettings('pricing', 'hourlyRate', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="deliveryFee">Delivery Fee (£)</Label>
              <Input
                id="deliveryFee"
                type="number"
                value={settings?.pricing.deliveryFee || 0}
                onChange={(e) => updateSettings('pricing', 'deliveryFee', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="setupFee">Setup Fee (£)</Label>
              <Input
                id="setupFee"
                type="number"
                value={settings?.pricing.setupFee || 0}
                onChange={(e) => updateSettings('pricing', 'setupFee', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operational Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Operational Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workingStart">Working Hours Start</Label>
                <Input
                  id="workingStart"
                  type="time"
                  value={settings?.operational.workingHours.start || ''}
                  onChange={(e) => updateNestedSettings('operational', 'workingHours', 'start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="workingEnd">Working Hours End</Label>
                <Input
                  id="workingEnd"
                  type="time"
                  value={settings?.operational.workingHours.end || ''}
                  onChange={(e) => updateNestedSettings('operational', 'workingHours', 'end', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bookingNotice">Minimum Booking Notice (hours)</Label>
              <Input
                id="bookingNotice"
                type="number"
                value={settings?.operational.bookingNotice || 0}
                onChange={(e) => updateSettings('operational', 'bookingNotice', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxBookingDays">Maximum Booking Days in Advance</Label>
              <Input
                id="maxBookingDays"
                type="number"
                value={settings?.operational.maxBookingDays || 0}
                onChange={(e) => updateSettings('operational', 'maxBookingDays', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive booking notifications via email</p>
              </div>
              <Input
                id="emailNotifications"
                type="checkbox"
                className="w-4 h-4"
                checked={settings?.notifications.emailNotifications || false}
                onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive booking notifications via SMS</p>
              </div>
              <Input
                id="smsNotifications"
                type="checkbox"
                className="w-4 h-4"
                checked={settings?.notifications.smsNotifications || false}
                onChange={(e) => updateSettings('notifications', 'smsNotifications', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bookingReminders">Booking Reminders</Label>
                <p className="text-sm text-gray-500">Send reminders to customers</p>
              </div>
              <Input
                id="bookingReminders"
                type="checkbox"
                className="w-4 h-4"
                checked={settings?.notifications.bookingReminders || false}
                onChange={(e) => updateSettings('notifications', 'bookingReminders', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paymentReminders">Payment Reminders</Label>
                <p className="text-sm text-gray-500">Send payment reminders to customers</p>
              </div>
              <Input
                id="paymentReminders"
                type="checkbox"
                className="w-4 h-4"
                checked={settings?.notifications.paymentReminders || false}
                onChange={(e) => updateSettings('notifications', 'paymentReminders', e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-medium text-gray-900">Version</p>
              <p className="text-gray-600">1.0.0</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Last Backup</p>
              <p className="text-gray-600">2024-01-23 10:30 AM</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Storage Used</p>
              <p className="text-gray-600">2.4 GB / 10 GB</p>
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Backup Data
            </Button>
            <Button variant="outline">
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}