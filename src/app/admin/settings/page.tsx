'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
  maintenanceStatus?: 'available' | 'maintenance' | 'out_of_service';
  maintenanceNotes?: string;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
}

interface MaintenanceForm {
  status: 'available' | 'maintenance' | 'out_of_service';
  notes: string;
  startDate: string;
  endDate: string;
}

export default function AdminSettings() {
  const [castles, setCastles] = useState<Castle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCastle, setSelectedCastle] = useState<Castle | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>({
    status: 'available',
    notes: '',
    startDate: '',
    endDate: ''
  });

  // Fetch castles from API
  const fetchCastles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/fleet');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched castles:', data);
        setCastles(data || []);
      } else {
        toast.error('Failed to fetch castles');
      }
    } catch (error) {
      console.error('Error fetching castles:', error);
      toast.error('Error loading castles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCastles();
  }, []);

  const handleCastleSelect = (castle: Castle) => {
    setSelectedCastle(castle);
    
    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString: string | undefined) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setMaintenanceForm({
      status: castle.maintenanceStatus || 'available',
      notes: castle.maintenanceNotes || '',
      startDate: formatDateForInput(castle.maintenanceStartDate),
      endDate: formatDateForInput(castle.maintenanceEndDate)
    });
  };

  const handleMaintenanceUpdate = async () => {
    if (!selectedCastle) return;

    // Validate required fields for maintenance/out_of_service status
    if (maintenanceForm.status !== 'available') {
      if (!maintenanceForm.startDate || !maintenanceForm.endDate) {
        toast.error('Start date and end date are required for maintenance or out of service status');
        return;
      }
      
      // Validate date range
      const startDate = new Date(maintenanceForm.startDate);
      const endDate = new Date(maintenanceForm.endDate);
      
      if (startDate > endDate) {
        toast.error('Start date must be before or equal to end date');
        return;
      }
    }

    setIsSaving(true);
    try {
      console.log('Updating maintenance for castle:', selectedCastle.id, maintenanceForm);
      
      const response = await fetch(`/api/admin/fleet/${selectedCastle.id}/maintenance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceForm),
      });

      if (response.ok) {
        const updatedCastle = await response.json();
        console.log('Updated castle:', updatedCastle);
        setCastles(prev => prev.map(castle => 
          castle.id === selectedCastle.id ? updatedCastle : castle
        ));
        setSelectedCastle(updatedCastle);
        toast.success(`Maintenance status updated for ${selectedCastle.name}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update maintenance status');
      }
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast.error('Error updating maintenance status');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'out_of_service':
        return <Badge className="bg-red-100 text-red-800">Out of Service</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-yellow-600" />;
      case 'out_of_service':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
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
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Castle Maintenance</h1>
          <p className="mt-2 text-gray-600">
            Manage maintenance status for your bouncy castle fleet
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={fetchCastles} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Castle List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="w-5 h-5 mr-2" />
              Castle Fleet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {castles.map((castle) => (
                <div
                  key={castle.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCastle?.id === castle.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCastleSelect(castle)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(castle.maintenanceStatus || 'available')}
                      <div>
                        <h3 className="font-medium text-gray-900">{castle.name}</h3>
                        <p className="text-sm text-gray-500">{castle.theme} • {castle.size}</p>
                      </div>
                    </div>
                    {getStatusBadge(castle.maintenanceStatus || 'available')}
                  </div>
                  {castle.maintenanceNotes && (
                    <p className="text-sm text-gray-600 mt-2">{castle.maintenanceNotes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Maintenance Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCastle ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-medium">{selectedCastle.name}</Label>
                  <p className="text-sm text-gray-500">{selectedCastle.theme} • {selectedCastle.size}</p>
                </div>

                <div>
                  <Label htmlFor="status">Maintenance Status</Label>
                  <select
                    id="status"
                    value={maintenanceForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'available' | 'maintenance' | 'out_of_service';
                      setMaintenanceForm(prev => ({
                        ...prev, 
                        status: newStatus,
                        // Clear notes and dates when switching to available
                        notes: newStatus === 'available' ? '' : prev.notes,
                        startDate: newStatus === 'available' ? '' : prev.startDate,
                        endDate: newStatus === 'available' ? '' : prev.endDate
                      }));
                    }}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>
                </div>

                {maintenanceForm.status !== 'available' && (
                  <>
                    <div>
                      <Label htmlFor="notes">Maintenance Notes</Label>
                      <Textarea
                        id="notes"
                        value={maintenanceForm.notes}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Enter maintenance details..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">
                          Start Date
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={maintenanceForm.startDate}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, startDate: e.target.value }))}
                          required
                          className={!maintenanceForm.startDate ? 'border-red-500' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">
                          End Date
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={maintenanceForm.endDate}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, endDate: e.target.value }))}
                          required
                          className={!maintenanceForm.endDate ? 'border-red-500' : ''}
                        />
                      </div>
                    </div>
                  </>
                )}
                {maintenanceForm.status !== 'available' && (
                  <p className="text-sm text-gray-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Maintenance events will span from 09:00 on the start date to 18:00 on the end date.
                  </p>
                )}

                <Button 
                  onClick={handleMaintenanceUpdate} 
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Updating...' : 'Update Maintenance Status'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Castle</h3>
                <p className="text-gray-600">
                  Choose a castle from the list to manage its maintenance status.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Maintenance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {castles.filter(c => (c.maintenanceStatus || 'available') === 'available').length}
              </div>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {castles.filter(c => (c.maintenanceStatus || 'available') === 'maintenance').length}
              </div>
              <p className="text-sm text-gray-600">In Maintenance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {castles.filter(c => (c.maintenanceStatus || 'available') === 'out_of_service').length}
              </div>
              <p className="text-sm text-gray-600">Out of Service</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}