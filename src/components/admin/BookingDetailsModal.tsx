import { Button } from '@/components/ui/button';
import { X, Edit2, Trash2, CheckCircle } from 'lucide-react';
import React from 'react';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  colorId?: string;
  status?: string;
}

interface BookingDetailsModalProps {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onApprove?: (eventId: string) => void;
  formatEventDate: (event: CalendarEvent) => string;
  formatEventTime: (event: CalendarEvent) => string;
  getStatusColor: (status: string) => string;
}

export function BookingDetailsModal({
  open,
  event,
  onClose,
  onEdit,
  onDelete,
  onApprove,
  formatEventDate,
  formatEventTime,
  getStatusColor
}: BookingDetailsModalProps) {
  if (!open || !event) return null;

  const status = event.status || 'confirmed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {event.summary}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Date:</strong> {formatEventDate(event)}  {formatEventTime(event)}</p>
                {event.location && (
                  <p><strong>Location:</strong> {event.location}</p>
                )}
                {event.description && (
                  <p><strong>Details:</strong> {event.description}</p>
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <p><strong>Contact:</strong> {event.attendees[0].displayName || event.attendees[0].email}</p>
                )}
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {status === 'pending' && onApprove && (
                <Button
                  onClick={() => onApprove(event.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}
              {status !== 'complete' && onEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(event)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={() => onDelete(event.id)}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 