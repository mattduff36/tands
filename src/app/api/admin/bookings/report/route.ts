import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/connection';
import { format } from 'date-fns';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingRef } = body;

    if (!bookingRef) {
      return NextResponse.json(
        { error: 'Booking reference is required' },
        { status: 400 }
      );
    }

    const client = await getPool().connect();
    
    try {
      // Get complete booking data (same query as export)
      const bookingQuery = `
        SELECT 
          id,
          booking_ref,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          castle_id,
          castle_name,
          date,
          payment_method,
          total_price,
          deposit,
          status,
          notes,
          created_at,
          updated_at,
          castle_type,
          start_date,
          end_date,
          event_duration,
          total_cost,
          calendar_event_id,
          agreement_signed,
          agreement_signed_at,
          agreement_signed_by,
          agreement_signed_method,
          agreement_ip_address,
          agreement_user_agent,
          agreement_pdf_generated,
          agreement_pdf_generated_at,
          agreement_email_opened,
          agreement_email_opened_at,
          agreement_viewed,
          agreement_viewed_at,
          audit_trail,
          email_sent,
          email_sent_at,
          manual_confirmation,
          confirmed_by
        FROM bookings 
        WHERE booking_ref = $1
      `;
      
      const bookingResult = await client.query(bookingQuery, [bookingRef]);
      
      if (bookingResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      const booking = bookingResult.rows[0];

      // Get audit trail
      let auditTrail = [];
      try {
        const auditQuery = `
          SELECT 
            timestamp,
            action,
            actor,
            actor_details,
            method,
            ip_address,
            user_agent,
            details
          FROM booking_audit_trail 
          WHERE booking_id = $1 
          ORDER BY timestamp ASC
        `;
        const auditResult = await client.query(auditQuery, [booking.id]);
        auditTrail = auditResult.rows;
      } catch (auditError) {
        auditTrail = booking.audit_trail || [];
      }

      // Generate PDF using React PDF (serverless-friendly)
      console.log('Generating PDF using React PDF...');
      
      const BookingReportDocument = createBookingReportDocument(booking, auditTrail);
      
      console.log('Creating PDF from React components...');
      const pdfBuffer = await pdf(BookingReportDocument).toBuffer();
      console.log('PDF generated successfully, size:', pdfBuffer.length);

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="booking-${bookingRef}-report-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error generating booking report:', error);
    return NextResponse.json(
      { error: 'Failed to generate booking report' },
      { status: 500 }
    );
  }
}

// React PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.3,
  },
  header: {
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyTagline: {
    fontSize: 9,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  reportDate: {
    fontSize: 8,
    color: '#666666',
  },
  section: {
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  leftColumn: {
    width: '50%',
    paddingRight: 10,
  },
  rightColumn: {
    width: '50%',
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'dotted',
    paddingVertical: 2,
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: '40%',
    fontSize: 9,
  },
  infoValue: {
    width: '60%',
    fontSize: 9,
  },
  statusBadge: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#000000',
  },
  highlightValue: {
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  financialHighlight: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  signatureSection: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  signatureVerified: {
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 5,
  },
  auditTable: {
    marginTop: 8,
  },
  auditRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 3,
  },
  auditHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 8,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  auditCell: {
    fontSize: 8,
    paddingHorizontal: 6,
    textAlign: 'left',
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
});

// Utility functions
const formatDate = (date: string | null) => {
  if (!date) return 'Not available';
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  } catch {
    return date;
  }
};

const formatDateOnly = (date: string | null) => {
  if (!date) return 'Not available';
  try {
    return format(new Date(date), 'dd/MM/yyyy');
  } catch {
    return date;
  }
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return '£0.00';
  return `£${amount.toFixed(2)}`;
};

// React PDF Document Component (using React.createElement for .ts compatibility)
function createBookingReportDocument(booking: any, auditTrail: any[]) {
  return React.createElement(Document, {},
    React.createElement(Page, { size: "A4", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.companyName }, "T&S Bouncy Castle Hire"),
        React.createElement(Text, { style: styles.companyTagline }, "Professional Bouncy Castle Rental Services"),
        React.createElement(Text, { style: styles.reportTitle }, "Comprehensive Booking Report"),
        React.createElement(Text, { style: styles.reportDate }, `Generated on ${formatDate(new Date().toISOString())}`)
      ),

      // Booking Overview
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Booking Overview"),
        React.createElement(View, { style: styles.row },
          React.createElement(View, { style: styles.leftColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Booking Reference:"),
              React.createElement(Text, { style: [styles.infoValue, styles.highlightValue] }, booking.booking_ref)
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Status:"),
              React.createElement(Text, { style: [styles.infoValue, styles.statusBadge] }, booking.status)
            )
          ),
          React.createElement(View, { style: styles.rightColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Booking Created:"),
              React.createElement(Text, { style: styles.infoValue }, formatDate(booking.created_at))
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Last Updated:"),
              React.createElement(Text, { style: styles.infoValue }, formatDate(booking.updated_at))
            )
          )
        )
      ),

      // Customer Information
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Customer Information"),
        React.createElement(View, { style: styles.row },
          React.createElement(View, { style: styles.leftColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Name:"),
              React.createElement(Text, { style: styles.infoValue }, booking.customer_name || 'Not provided')
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Email:"),
              React.createElement(Text, { style: styles.infoValue }, booking.customer_email || 'Not provided')
            )
          ),
          React.createElement(View, { style: styles.rightColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Phone:"),
              React.createElement(Text, { style: styles.infoValue }, booking.customer_phone || 'Not provided')
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Address:"),
              React.createElement(Text, { style: styles.infoValue }, booking.customer_address || 'Not provided')
            )
          )
        )
      ),

      // Event Details
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Event Details"),
        React.createElement(View, { style: styles.row },
          React.createElement(View, { style: styles.leftColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Castle:"),
              React.createElement(Text, { style: styles.infoValue }, booking.castle_name || 'Not specified')
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Castle Type:"),
              React.createElement(Text, { style: styles.infoValue }, booking.castle_type || 'Not specified')
            )
          ),
          React.createElement(View, { style: styles.rightColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Event Date:"),
              React.createElement(Text, { style: styles.infoValue }, formatDateOnly(booking.date || booking.start_date))
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Duration:"),
              React.createElement(Text, { style: styles.infoValue }, booking.event_duration || 'Not specified')
            )
          )
        ),
        booking.notes ? React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "Notes:"),
          React.createElement(Text, { style: styles.infoValue }, booking.notes)
        ) : null
      ),

      // Financial Information
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Financial Information"),
        React.createElement(View, { style: styles.row },
          React.createElement(View, { style: styles.leftColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Total Price:"),
              React.createElement(Text, { style: [styles.infoValue, styles.financialHighlight] },
                formatCurrency(booking.total_price || booking.total_cost)
              )
            ),
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Deposit:"),
              React.createElement(Text, { style: styles.infoValue }, formatCurrency(booking.deposit))
            )
          ),
          React.createElement(View, { style: styles.rightColumn },
            React.createElement(View, { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Payment Method:"),
              React.createElement(Text, { style: styles.infoValue }, booking.payment_method || 'Not specified')
            )
          )
        )
      ),

      // Agreement Information
      booking.agreement_signed ? 
        React.createElement(View, { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, "Agreement & Legal Information"),
          React.createElement(View, { style: styles.signatureSection },
            React.createElement(Text, { style: styles.signatureVerified }, "✓ AGREEMENT DIGITALLY SIGNED"),
            React.createElement(View, { style: styles.row },
              React.createElement(View, { style: styles.leftColumn },
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Signed By:"),
                  React.createElement(Text, { style: styles.infoValue }, booking.agreement_signed_by || 'Not recorded')
                ),
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Signed At:"),
                  React.createElement(Text, { style: styles.infoValue }, formatDate(booking.agreement_signed_at))
                ),
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Method:"),
                  React.createElement(Text, { style: styles.infoValue }, booking.agreement_signed_method || 'Digital signature')
                )
              ),
              React.createElement(View, { style: styles.rightColumn },
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "IP Address:"),
                  React.createElement(Text, { style: styles.infoValue }, booking.agreement_ip_address || 'Not recorded')
                ),
                booking.agreement_user_agent ? React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "User Agent:"),
                  React.createElement(Text, { style: [styles.infoValue, { fontSize: 7 }] }, booking.agreement_user_agent)
                ) : null
              )
            )
          )
        ) :
        React.createElement(View, { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, "Agreement Status"),
          React.createElement(View, { style: styles.infoRow },
            React.createElement(Text, { style: styles.infoLabel }, "Agreement Status:"),
            React.createElement(Text, { style: [styles.infoValue, { fontWeight: 'bold' }] }, "⏳ Pending Signature")
          )
        ),

      // Audit Trail
      auditTrail.length > 0 ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Audit Trail"),
        React.createElement(View, { style: styles.auditTable },
          React.createElement(View, { style: styles.auditHeader },
            React.createElement(Text, { style: [styles.auditCell, { width: '25%' }] }, "Date/Time"),
            React.createElement(Text, { style: [styles.auditCell, { width: '20%' }] }, "Action"),
            React.createElement(Text, { style: [styles.auditCell, { width: '15%' }] }, "Actor"),
            React.createElement(Text, { style: [styles.auditCell, { width: '15%' }] }, "Method"),
            React.createElement(Text, { style: [styles.auditCell, { width: '25%' }] }, "Details")
          ),
          ...auditTrail.slice(0, 10).map((entry, index) =>
            React.createElement(View, { key: index, style: styles.auditRow },
              React.createElement(Text, { style: [styles.auditCell, { width: '25%' }] }, formatDate(entry.timestamp)),
              React.createElement(Text, { style: [styles.auditCell, { width: '20%' }] }, entry.action || 'N/A'),
              React.createElement(Text, { style: [styles.auditCell, { width: '15%' }] }, entry.actor || 'System'),
              React.createElement(Text, { style: [styles.auditCell, { width: '15%' }] }, entry.method || 'N/A'),
              React.createElement(Text, { style: [styles.auditCell, { width: '25%' }] }, entry.details || 'N/A')
            )
          )
        )
      ) : null,

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, "T&S Bouncy Castle Hire - Booking Management System"),
        React.createElement(Text, {}, `This report contains all available data for booking ${booking.booking_ref}`),
        React.createElement(Text, {}, "Document includes digital signature verification and audit trails for legal compliance")
      )
    )
  );
}

