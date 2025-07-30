import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import React from 'react';

export interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

export interface BookingFormData {
  castle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  singleDate: string;
  multipleDate: boolean;
  startDate: string;
  endDate: string;
  overnight: boolean;
  additionalCosts: boolean;
  additionalCostsDescription: string;
  additionalCostsAmount: number;
  saveAsConfirmed?: boolean; // For manual confirmation workflow
}

interface BookingFormModalProps {
  open: boolean;
  isEditing: boolean;
  castles: Castle[];
  bookingForm: BookingFormData;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: keyof BookingFormData, value: string | boolean | number) => void;
  calculateTotalCost: () => number;
  showConfirmationToggle?: boolean; // Show "Save as Confirmed" option for new bookings
}

export function BookingFormModal({
  open,
  isEditing,
  castles,
  bookingForm,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
  calculateTotalCost,
  showConfirmationToggle = false
}: BookingFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Booking' : 'Add New Booking'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Booking Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Castle Selection */}
            <div className="space-y-2">
              <Label htmlFor="castle" className="text-sm font-medium">
                Bouncy Castle *
              </Label>
              <Select
                value={bookingForm.castle}
                onValueChange={(value) => onFormChange('castle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bouncy castle" />
                </SelectTrigger>
                <SelectContent>
                  {castles.map((castle) => (
                    <SelectItem key={castle.id} value={castle.id.toString()}>
                      {castle.name} - £{Math.floor(castle.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Details - First Line: Name and Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Customer Name *
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  value={bookingForm.customerName}
                  onChange={(e) => onFormChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-sm font-medium">
                  Contact Number *
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={bookingForm.customerPhone}
                  onChange={(e) => onFormChange('customerPhone', e.target.value)}
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>

            {/* Email Address - Second Line */}
            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={bookingForm.customerEmail}
                onChange={(e) => onFormChange('customerEmail', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            {/* Address - Third Line */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Delivery Address *
              </Label>
              <Input
                id="address"
                type="text"
                value={bookingForm.address}
                onChange={(e) => onFormChange('address', e.target.value)}
                placeholder="Enter delivery address"
                required
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multipleDate"
                  checked={bookingForm.multipleDate}
                  onCheckedChange={(checked) => onFormChange('multipleDate', !!checked)}
                />
                <Label htmlFor="multipleDate" className="text-sm font-medium">
                  Multiple days
                </Label>
              </div>

              {!bookingForm.multipleDate ? (
                <div className="space-y-2">
                  <Label htmlFor="singleDate" className="text-sm font-medium">
                    Date *
                  </Label>
                  <Input
                    id="singleDate"
                    type="date"
                    value={bookingForm.singleDate}
                    onChange={(e) => onFormChange('singleDate', e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={bookingForm.startDate}
                      onChange={(e) => onFormChange('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium">
                      End Date *
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={bookingForm.endDate}
                      onChange={(e) => onFormChange('endDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Overnight Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overnight"
                  checked={bookingForm.overnight}
                  onCheckedChange={(checked) => onFormChange('overnight', !!checked)}
                />
                <Label htmlFor="overnight" className="text-sm font-medium">
                  Keeping overnight (+£20)
                </Label>
              </div>
            </div>

            {/* Additional Costs Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="additionalCosts"
                  checked={bookingForm.additionalCosts}
                  onCheckedChange={(checked) => onFormChange('additionalCosts', !!checked)}
                />
                <Label htmlFor="additionalCosts" className="text-sm font-medium">
                  Additional costs?
                </Label>
              </div>
              
              {bookingForm.additionalCosts && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="additionalCostsDescription" className="text-sm font-medium">
                      Description
                    </Label>
                    <Input
                      id="additionalCostsDescription"
                      type="text"
                      value={bookingForm.additionalCostsDescription}
                      onChange={(e) => onFormChange('additionalCostsDescription', e.target.value)}
                      placeholder="e.g., Extra setup, delivery fee, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalCostsAmount" className="text-sm font-medium">
                      Amount (£)
                    </Label>
                    <Input
                      id="additionalCostsAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bookingForm.additionalCostsAmount}
                      onChange={(e) => onFormChange('additionalCostsAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cost Summary */}
            {bookingForm.castle && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Castle:</span>
                    <span>{castles.find(c => c.id.toString() === bookingForm.castle)?.name}</span>
                  </div>
                  {(() => {
                    const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
                    const basePrice = Math.floor(selectedCastle?.price || 0);
                    let numberOfDays = 1;
                    if (bookingForm.multipleDate && bookingForm.startDate && bookingForm.endDate) {
                      const startDate = new Date(bookingForm.startDate);
                      const endDate = new Date(bookingForm.endDate);
                      
                      // Check if dates are valid
                      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                        const timeDiff = endDate.getTime() - startDate.getTime();
                        numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                        // Ensure numberOfDays is at least 1
                        numberOfDays = Math.max(1, numberOfDays);
                      }
                    }
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Daily Rate:</span>
                          <span>£{isNaN(basePrice) ? 0 : basePrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Days:</span>
                          <span>{numberOfDays}</span>
                        </div>
                      </>
                    );
                  })()}
                  {bookingForm.overnight && (
                    <div className="flex justify-between">
                      <span>Overnight:</span>
                      <span>£20</span>
                    </div>
                  )}
                  {bookingForm.additionalCosts && (
                    <div className="flex justify-between">
                      <span>{bookingForm.additionalCostsDescription}:</span>
                      <span>£{isNaN(bookingForm.additionalCostsAmount) ? 0 : bookingForm.additionalCostsAmount}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>£{calculateTotalCost()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Confirmation Toggle */}
            {!isEditing && showConfirmationToggle && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="saveAsConfirmed"
                    checked={bookingForm.saveAsConfirmed || false}
                    onCheckedChange={(checked) => 
                      onFormChange('saveAsConfirmed', checked === true)
                    }
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor="saveAsConfirmed" 
                      className="text-sm font-medium text-blue-900 cursor-pointer"
                    >
                      Save as Confirmed
                    </Label>
                    <p className="text-xs text-blue-700 mt-1">
                      Customer will sign agreement manually/physically. Skip email automation and mark as confirmed immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={
                  bookingForm.saveAsConfirmed 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }
              >
                {isSubmitting 
                  ? `${isEditing ? 'Updating' : (bookingForm.saveAsConfirmed ? 'Creating Confirmed' : 'Creating')} Booking...`
                  : `${isEditing ? 'Update' : (bookingForm.saveAsConfirmed ? 'Create Confirmed' : 'Create')} Booking`
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 