'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Castle, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Save,
  X,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Settings, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { generateCastleDescription, generateAlternativeDescription } from '@/lib/utils/description-generator';
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

interface CastleFormData {
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

interface MaintenanceForm {
  status: 'available' | 'maintenance' | 'out_of_service';
  notes: string;
  startDate: string;
  endDate: string;
}

export default function FleetManagement() {
  const [castles, setCastles] = useState<Castle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCastle, setEditingCastle] = useState<Castle | null>(null);
  const [formData, setFormData] = useState<CastleFormData>({
    name: '',
    theme: '',
    size: '',
    price: 0,
    description: '',
    imageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedCastle, setSelectedCastle] = useState<Castle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>({
    status: 'available',
    notes: '',
    startDate: '',
    endDate: ''
  });

  // Fetch castles data
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

  // Generate description based on form data
  const handleGenerateDescription = (useAlternative: boolean = false) => {
    if (!formData.name || !formData.theme || !formData.size || !formData.price) {
      alert('Please fill in Castle Name, Theme, Size, and Price first to generate a description.');
      return;
    }

    setIsGeneratingDescription(true);
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const newDescription = useAlternative 
        ? generateAlternativeDescription(formData)
        : generateCastleDescription(formData);
      
      setFormData(prev => ({ ...prev, description: newDescription }));
      setIsGeneratingDescription(false);
    }, 500);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCastle 
        ? `/api/admin/fleet/${editingCastle.id}` 
        : '/api/admin/fleet';
      
      const method = editingCastle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCastles();
        handleCloseModal();
      } else {
        console.error('Failed to save castle');
      }
    } catch (error) {
      console.error('Error saving castle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bouncy castle?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/fleet/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCastles();
      } else {
        console.error('Failed to delete castle');
      }
    } catch (error) {
      console.error('Error deleting castle:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/admin/fleet/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        console.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleEdit = (castle: Castle) => {
    setEditingCastle(castle);
    setFormData({
      name: castle.name,
      theme: castle.theme,
      size: castle.size,
      price: castle.price,
      description: castle.description,
      imageUrl: castle.imageUrl
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCastle(null);
    setFormData({
      name: '',
      theme: '',
      size: '',
      price: 0,
      description: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCastle(null);
    setFormData({
      name: '',
      theme: '',
      size: '',
      price: 0,
      description: '',
      imageUrl: ''
    });
  };

  // Maintenance functions
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Castle className="w-6 h-6 mr-2" />
            Fleet Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your bouncy castle fleet - add, edit, or remove castles
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Castle
          </Button>
        </div>
      </div>

      {/* Castles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {castles.map((castle) => (
            <Card key={castle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={castle.imageUrl}
                  alt={castle.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{castle.name}</h3>
                  <Badge variant="secondary">{castle.theme}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{castle.size}</p>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{castle.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">£{Math.floor(castle.price)}/day</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(castle)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(castle.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingCastle ? 'Edit Castle' : 'Add New Castle'}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Castle Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Input
                      id="theme"
                      value={formData.theme}
                      onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      placeholder="e.g., 12ft x 15ft"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per Day (£) - whole pounds only</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Math.floor(Number(e.target.value)) }))}
                      required
                      placeholder="e.g., 75"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">Description</Label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDescription(false)}
                        disabled={isGeneratingDescription}
                        className="text-xs"
                      >
                        {isGeneratingDescription ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-1" />
                        )}
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDescription(true)}
                        disabled={isGeneratingDescription}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Alternative
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                    placeholder="Enter a description or use the Generate button to auto-create one based on the castle details above..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Fill in the castle name, theme, size, and price first, then click "Generate" for an automatic description!
                  </p>
                </div>

                <div>
                  <Label htmlFor="image">Castle Image</Label>
                  <div className="mt-2">
                    {formData.imageUrl && (
                      <div className="mb-4">
                        <Image
                          src={formData.imageUrl}
                          alt="Castle preview"
                          width={200}
                          height={150}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    <Input
                      type="text"
                      placeholder="Or enter image URL"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Castle'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Section */}
      <div className="border-t pt-8 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Wrench className="w-6 h-6 mr-2" />
              Fleet Maintenance
            </h2>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Castle List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="w-5 h-5 mr-2" />
                Castle Status
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
    </div>
  );
}