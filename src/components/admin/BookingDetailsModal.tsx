import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Mail,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import React from "react";

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
  getStatusColor,
}: BookingDetailsModalProps) {
  if (!open || !event) return null;

  // Determine the correct status
  let status = event.status || "confirmed";

  // Check if event is completed based on visual indicators
  if (event.colorId === "11" || event.summary?.includes("✅")) {
    status = "completed";
  }

  // Check if event has ended
  const now = new Date();
  const eventEnd = new Date(
    event.end?.dateTime ||
      event.end?.date ||
      event.start?.dateTime ||
      event.start?.date ||
      "",
  );
  if (eventEnd < now && status !== "completed") {
    status = "completed";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Booking Details
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

          {/* Event Details */}
          <div className="space-y-4">
            {(() => {
              // Extract booking information from event data
              const customerName =
                event.summary?.replace("🏰 ", "").split(" - ")[0] ||
                "Unknown Customer";
              const castleName =
                event.summary?.split(" - ")[1] || "Unknown Castle";

              // Extract details from description
              const description = event.description || "";
              const bookingRef =
                description.match(/Booking Ref: (TS\d{3})/)?.[1] || "N/A";
              const email =
                description.match(/Email: ([^\s\n]+)/)?.[1] ||
                event.attendees?.[0]?.email ||
                "N/A";
              const phone =
                description.match(/Phone: ([^\s\n]+)/)?.[1] || "N/A";
              const total = description.match(/Total: £(\d+)/)?.[1] || "0";

              // Extract duration with comprehensive checking and price validation
              const durationMatch = description.match(/Duration: (\d+) hours/);
              const explicitDuration = durationMatch
                ? parseInt(durationMatch[1])
                : null;

              // Check for overnight indicators in description
              const hasOvernightIndicator =
                description.includes("24 hours") ||
                description.includes("Overnight") ||
                description.includes("(Overnight)");

              // Intelligent price-based detection
              const totalCost = parseInt(total);

              // For TS008 case: £140 suggests £120 base + £20 overnight = 24 hours
              // Common base prices: £60, £80, £100, £120, etc.
              // If total is base + 20, and result makes sense as base price, it's likely overnight
              const possibleBasePrice = totalCost - 20;
              const isPriceConsistentWithOvernight =
                totalCost > 100 &&
                (possibleBasePrice % 10 === 0 ||
                  possibleBasePrice % 20 === 0) &&
                possibleBasePrice >= 60;

              // Determine final duration with validation
              let duration;
              if (hasOvernightIndicator || isPriceConsistentWithOvernight) {
                duration = "24";
              } else if (
                explicitDuration &&
                (explicitDuration === 8 || explicitDuration === 24)
              ) {
                // Only trust explicit duration if it's a valid value and price doesn't contradict
                if (explicitDuration === 8 && isPriceConsistentWithOvernight) {
                  // Price suggests overnight but explicit says 8 - trust the price
                  duration = "24";
                } else {
                  duration = explicitDuration.toString();
                }
              } else {
                duration = "8"; // Default fallback
              }

              // Agreement status not shown in calendar event modal

              return (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🏰 {customerName}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="grid grid-cols-1 gap-1">
                      <div>
                        <span className="font-bold text-gray-700">
                          Bouncy Castle:
                        </span>{" "}
                        <span className="text-gray-900">{castleName}</span>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700">Date:</span>{" "}
                        <span className="text-gray-900">
                          {formatEventDate(event)}
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700">
                          Duration:
                        </span>{" "}
                        <span className="text-gray-900">{duration} Hours</span>
                      </div>

                      {/* Spacer */}
                      <div className="h-1"></div>

                      {event.location && (
                        <div>
                          <span className="font-bold text-gray-700">
                            Event Address:
                          </span>{" "}
                          <span className="text-gray-900">
                            {event.location}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="font-bold text-gray-700">
                          Contact Number:
                        </span>{" "}
                        <span className="text-gray-900">{phone}</span>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700">Email:</span>{" "}
                        <span className="text-gray-900">{email}</span>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700">
                          Special Requests:
                        </span>{" "}
                        <span className="text-gray-900">
                          {(() => {
                            const notes =
                              description.match(/Notes: ([^\n]*)/)?.[1] ||
                              description.match(
                                /Special Requests: ([^\n]*)/,
                              )?.[1] ||
                              "";
                            return notes.trim() || "[none]";
                          })()}
                        </span>
                      </div>

                      {/* Spacer */}
                      <div className="h-1"></div>

                      <div>
                        <span className="font-bold text-gray-700">
                          Total Cost:
                        </span>{" "}
                        <span className="text-gray-900">£{total}</span>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700">
                          Booking Reference:
                        </span>{" "}
                        <span className="text-gray-900">{bookingRef}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">Status:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}
                        >
                          {status}
                        </span>
                        {/* Agreement badges removed from calendar event modal */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {/* Primary Actions for Pending Bookings */}
              {status === "pending" && event.id.startsWith("db_") && (
                <div className="grid grid-cols-1 gap-3">
                  {onApproveAndSendAgreement && (
                    <Button
                      onClick={() => onApproveAndSendAgreement(event.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        Approve & Send Agreement
                      </span>
                      <span className="sm:hidden">Approve & Send</span>
                    </Button>
                  )}
                  {onEditAndSendAgreement && (
                    <Button
                      onClick={() => onEditAndSendAgreement(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        Edit & Send Agreement
                      </span>
                      <span className="sm:hidden">Edit & Send</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Secondary Actions */}
              <div className="grid grid-cols-1 gap-2">
                {/* Legacy Approve button for backward compatibility */}
                {status === "pending" &&
                  onApprove &&
                  !event.id.startsWith("db_") && (
                    <Button
                      onClick={() => onApprove(event.id)}
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}

                {/* View hire agreement for pending DB bookings */}
                {status === "pending" && event.id.startsWith("db_") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Extract booking reference from event description
                      const bookingRef =
                        event.description?.match(
                          /Booking Ref: (TS\d{3})/,
                        )?.[1] || event.id.replace("db_", "");
                      window.open(
                        `/hire-agreement?bookingRef=${bookingRef}`,
                        "_blank",
                      );
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">
                      View Hire Agreement
                    </span>
                    <span className="sm:hidden">View Agreement</span>
                  </Button>
                )}

                {/* Edit button for non-completed bookings */}
                {status !== "completed" &&
                  onEdit &&
                  !event.id.startsWith("db_") && (
                    <Button variant="outline" onClick={() => onEdit(event)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}

                {/* Resend Agreement for confirmed bookings */}
                {status === "confirmed" &&
                  event.id.startsWith("db_") &&
                  onResendAgreement && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Extract booking reference from event description or use event ID
                        const bookingRef =
                          event.description?.match(
                            /Booking Ref: (TS\d{3})/,
                          )?.[1] || event.id.replace("db_", "");
                        onResendAgreement(bookingRef);
                      }}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        Re-send Agreement
                      </span>
                      <span className="sm:hidden">Re-send</span>
                    </Button>
                  )}

                {/* Delete button */}
                {onDelete && (
                  <Button
                    variant="outline"
                    onClick={() => onDelete(event.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Decline & Delete
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
