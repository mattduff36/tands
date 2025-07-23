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
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

interface CastleFormData {
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
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
  const [isMigrating, setIsMigrating] = useState(false);

  // Fetch castles data
  const fetchCastles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/fleet');
      if (response.ok) {
        const data = await response.json();
        setCastles(data);
      } else {
        console.error('Failed to fetch castles');
      }
    } catch (error) {
      console.error('Error fetching castles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCastles();
  }, []);

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

  // Handle image migration
  const handleMigrateImages = async () => {
    if (!confirm('This will migrate all existing castle images from local storage to Google Drive. This may take a few minutes. Continue?')) {
      return;
    }

    setIsMigrating(true);
    try {
      const response = await fetch('/api/admin/fleet/migrate-images', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Migration completed successfully! ${data.results.filter((r: any) => r.status === 'success').length} images migrated.`);
        await fetchCastles(); // Refresh the castles data
      } else {
        const error = await response.json();
        alert(`Migration failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error migrating images:', error);
      alert('Failed to migrate images. Please try again.');
    } finally {
      setIsMigrating(false);
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
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button onClick={handleMigrateImages} variant="outline" disabled={isMigrating}>
            <Upload className="w-4 h-4 mr-2" />
            {isMigrating ? 'Migrating...' : 'Migrate Images to Drive'}
          </Button>
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
                  <span className="text-lg font-bold text-green-600">£{castle.price}/day</span>
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
                    <Label htmlFor="price">Price per Day (£)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
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
    </div>
  );
}