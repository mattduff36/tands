import { Button } from '@/components/ui/button';
import { X, Edit2, Trash2, CheckCircle, FileText, Mail, UserCheck, RefreshCw, FileCheck } from 'lucide-react';
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
  onApproveAndSendAgreement?: (eventId: string) => void;
  onEditAndSendAgreement?: (event: CalendarEvent) => void;
  onExpireBooking?: (eventId: string) => void;
  onResendAgreement?: (bookingRef: string) => void;
  onManualSign?: (bookingRef: string) => void;
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
  onApproveAndSendAgreement,
  onEditAndSendAgreement,
  onExpireBooking,
  onResendAgreement,
  onManualSign,
  formatEventDate,
  formatEventTime,
  getStatusColor
}: BookingDetailsModalProps) {
  if (!open || !event) return null;

  const status = event.status || 'confirmed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Details</h2>
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
            <div className="flex flex-col gap-3 pt-4 border-t">
              {/* Primary Actions for Pending Bookings */}
              {status === 'pending' && event.id.startsWith('db_') && (
                <div className="grid grid-cols-1 gap-3">
                  {onApproveAndSendAgreement && (
                    <Button
                      onClick={() => onApproveAndSendAgreement(event.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Approve & Send Agreement</span>
                      <span className="sm:hidden">Approve & Send</span>
                    </Button>
                  )}
                  {onEditAndSendAgreement && (
                    <Button
                      onClick={() => onEditAndSendAgreement(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Edit & Send Agreement</span>
                      <span className="sm:hidden">Edit & Send</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Secondary Actions */}
              <div className="grid grid-cols-1 gap-2">
                {/* Legacy Approve button for backward compatibility */}
                {status === 'pending' && onApprove && !event.id.startsWith('db_') && (
                  <Button
                    onClick={() => onApprove(event.id)}
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}

                {/* Manual hire agreement for pending DB bookings */}
                {status === 'pending' && event.id.startsWith('db_') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Extract booking reference from event description
                      const bookingRef = event.description?.match(/Booking Ref: (TS\d{3})/)?.[1] || 
                                       event.id.replace('db_', '');
                      window.open(`/hire-agreement?bookingRef=${bookingRef}`, '_blank');
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Manual Agreement</span>
                    <span className="sm:hidden">Manual</span>
                  </Button>
                )}

                {/* Edit button for non-completed bookings */}
                {status !== 'completed' && onEdit && !event.id.startsWith('db_') && (
                  <Button
                    variant="outline"
                    onClick={() => onEdit(event)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}

                {/* Expire button for pending bookings */}
                {status === 'pending' && onExpireBooking && (
                  <Button
                    variant="outline"
                    onClick={() => onExpireBooking(event.id)}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Expire
                  </Button>
                )}

                {/* Agreement actions for confirmed bookings awaiting signature */}
                {status === 'confirmed' && event.id.startsWith('db_') && (
                  <>
                    {/* Check if agreement is not signed by looking for "Awaiting Signature" in description */}
                    {(event.description?.includes('Awaiting Signature') || !event.description?.includes('Agreement Signed')) && (
                      <>
                        {onResendAgreement && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              const bookingRef = event.description?.match(/Booking Ref: (TS\d{3})/)?.[1] || 
                                             event.id.replace('db_', '');
                              onResendAgreement(bookingRef);
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Resend Agreement</span>
                            <span className="sm:hidden">Resend</span>
                          </Button>
                        )}
                        {onManualSign && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              const bookingRef = event.description?.match(/Booking Ref: (TS\d{3})/)?.[1] || 
                                             event.id.replace('db_', '');
                              onManualSign(bookingRef);
                            }}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <FileCheck className="w-4 h-4 mr-2" />
                            <span className="hidden lg:inline">Manual Sign</span>
                            <span className="lg:hidden">Sign</span>
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Delete button */}
                {onDelete && (
                  <Button
                    variant="outline"
                    onClick={() => onDelete(event.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 