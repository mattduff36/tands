import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/connection';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';

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

      // Generate PDF - Configure for serverless environments
      const isDev = process.env.NODE_ENV === 'development';
      const isVercel = process.env.VERCEL === '1';
      
      console.log('PDF Generation Debug:', {
        isDev,
        isVercel,
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform
      });
      
      let browserConfig: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      };

      // Add Vercel-specific configuration
      if (isVercel) {
        console.log('Configuring for Vercel environment');
        browserConfig.args.push(
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        );
        // Try to use the system Chrome if available
        try {
          const chromium = require('@sparticuz/chromium');
          browserConfig.executablePath = await chromium.executablePath();
          browserConfig.args.push(...chromium.args);
          console.log('Using @sparticuz/chromium executable:', browserConfig.executablePath);
        } catch (e) {
          console.error('Failed to load @sparticuz/chromium:', e);
          console.log('Falling back to default Puppeteer');
        }
      }
      
      console.log('Browser config:', JSON.stringify(browserConfig, null, 2));
      
      let browser;
      let pdfBuffer;
      
      try {
        console.log('Launching browser...');
        browser = await puppeteer.launch(browserConfig);
        console.log('Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('New page created');
        
        // Set page timeout for serverless environments
        page.setDefaultTimeout(30000);
        
        // Create HTML content for the report
        console.log('Generating HTML content...');
        const htmlContent = generateBookingReportHTML(booking, auditTrail);
        console.log('HTML content generated, length:', htmlContent.length);
        
        console.log('Setting page content...');
        await page.setContent(htmlContent, { 
          waitUntil: 'networkidle0',
          timeout: 15000
        });
        console.log('Page content set successfully');
        
        console.log('Generating PDF...');
        pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm'
          },
          scale: 0.8,
          timeout: 30000
        });
        console.log('PDF generated successfully, size:', pdfBuffer.length);
        
      } catch (pdfError) {
        console.error('PDF generation error details:', {
          message: pdfError instanceof Error ? pdfError.message : String(pdfError),
          stack: pdfError instanceof Error ? pdfError.stack : undefined,
          name: pdfError instanceof Error ? pdfError.name : undefined
        });
        throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
      } finally {
        if (browser) {
          console.log('Closing browser...');
          try {
            await browser.close();
            console.log('Browser closed successfully');
          } catch (closeError) {
            console.error('Error closing browser:', closeError);
          }
        }
      }

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

function generateBookingReportHTML(booking: any, auditTrail: any[]): string {
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Report - ${booking.booking_ref}</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.3;
          color: #000;
          max-width: 210mm;
          margin: 0 auto;
          padding: 15mm;
          font-size: 10pt;
          background-color: white;
        }
        .document {
          background-color: white;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .company-tagline {
          font-size: 9pt;
          margin-bottom: 8px;
          font-style: italic;
        }
        .report-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .report-date {
          font-size: 8pt;
          color: #666;
        }
        .content {
          padding: 0;
        }
        .section {
          margin: 12px 0;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          color: #000;
          border-bottom: 1px solid #000;
          margin-bottom: 8px;
          padding-bottom: 2px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 9pt;
        }
        .info-table td {
          padding: 2px 8px 2px 0;
          vertical-align: top;
          border-bottom: 1px dotted #ccc;
        }
        .info-label {
          font-weight: bold;
          width: 30%;
          color: #000;
        }
        .info-value {
          color: #000;
          width: 70%;
        }
        .two-column {
          display: table;
          width: 100%;
          table-layout: fixed;
        }
        .column {
          display: table-cell;
          width: 50%;
          padding-right: 10px;
          vertical-align: top;
        }
        .column:last-child {
          padding-right: 0;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .status-badge {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 8pt;
          padding: 1px 4px;
          border: 1px solid #000;
        }
        .status-confirmed { 
          background-color: #fff;
          color: #000; 
        }
        .status-pending { 
          background-color: #fff;
          color: #000; 
        }
        .status-cancelled { 
          background-color: #fff;
          color: #000; 
        }
        .audit-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 8pt;
          border: 1px solid #000;
        }
        .audit-table th,
        .audit-table td {
          border: 1px solid #000;
          padding: 3px 6px;
          text-align: left;
        }
        .audit-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          font-size: 8pt;
        }
        .signature-section {
          border: 1px solid #000;
          padding: 8px;
          margin: 8px 0;
          background-color: #f9f9f9;
        }
        .signature-verified {
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 5px;
        }
        .highlight-value {
          font-weight: bold;
          text-decoration: underline;
        }
        .financial-highlight {
          font-weight: bold;
          font-size: 10pt;
        }
        .page-break {
          page-break-before: always;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #000;
          font-size: 8pt;
          color: #666;
          text-align: center;
        }
        .footer strong {
          color: #000;
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <div class="company-name">T&S Bouncy Castle Hire</div>
          <div class="company-tagline">Professional Bouncy Castle Rental Services</div>
          <div class="report-title">Comprehensive Booking Report</div>
          <div class="report-date">Generated on ${formatDate(new Date().toISOString())}</div>
        </div>
        
        <div class="content">

      <div class="section">
        <div class="section-title">Booking Overview</div>
        <div class="two-column">
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Booking Reference:</td>
                <td class="info-value highlight-value">${booking.booking_ref}</td>
              </tr>
              <tr>
                <td class="info-label">Status:</td>
                <td class="info-value"><span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
              </tr>
            </table>
          </div>
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Booking Created:</td>
                <td class="info-value">${formatDate(booking.created_at)}</td>
              </tr>
              <tr>
                <td class="info-label">Last Updated:</td>
                <td class="info-value">${formatDate(booking.updated_at)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="two-column">
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Name:</td>
                <td class="info-value">${booking.customer_name || 'Not provided'}</td>
              </tr>
              <tr>
                <td class="info-label">Email:</td>
                <td class="info-value">${booking.customer_email || 'Not provided'}</td>
              </tr>
            </table>
          </div>
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Phone:</td>
                <td class="info-value">${booking.customer_phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td class="info-label">Address:</td>
                <td class="info-value">${booking.customer_address || 'Not provided'}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Event Details</div>
        <div class="two-column">
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Castle:</td>
                <td class="info-value">${booking.castle_name || 'Not specified'}</td>
              </tr>
              <tr>
                <td class="info-label">Castle Type:</td>
                <td class="info-value">${booking.castle_type || 'Not specified'}</td>
              </tr>
            </table>
          </div>
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Event Date:</td>
                <td class="info-value">${formatDateOnly(booking.date || booking.start_date)}</td>
              </tr>
              <tr>
                <td class="info-label">Duration:</td>
                <td class="info-value">${booking.event_duration || 'Not specified'}</td>
              </tr>
            </table>
          </div>
        </div>
        ${booking.notes ? `
        <table class="info-table">
          <tr>
            <td class="info-label">Notes:</td>
            <td class="info-value">${booking.notes}</td>
          </tr>
        </table>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Financial Information</div>
        <div class="two-column">
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Total Price:</td>
                <td class="info-value financial-highlight">${formatCurrency(booking.total_price || booking.total_cost)}</td>
              </tr>
              <tr>
                <td class="info-label">Deposit:</td>
                <td class="info-value">${formatCurrency(booking.deposit)}</td>
              </tr>
            </table>
          </div>
          <div class="column">
            <table class="info-table">
              <tr>
                <td class="info-label">Payment Method:</td>
                <td class="info-value">${booking.payment_method || 'Not specified'}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      ${booking.agreement_signed ? `
      <div class="section">
        <div class="section-title">Agreement & Legal Information</div>
        <div class="signature-section">
          <div class="signature-verified">✓ AGREEMENT DIGITALLY SIGNED</div>
          <div class="two-column">
            <div class="column">
              <table class="info-table">
                <tr>
                  <td class="info-label">Signed By:</td>
                  <td class="info-value">${booking.agreement_signed_by || 'Not recorded'}</td>
                </tr>
                <tr>
                  <td class="info-label">Signed At:</td>
                  <td class="info-value">${formatDate(booking.agreement_signed_at)}</td>
                </tr>
                <tr>
                  <td class="info-label">Method:</td>
                  <td class="info-value">${booking.agreement_signed_method || 'Digital signature'}</td>
                </tr>
              </table>
            </div>
            <div class="column">
              <table class="info-table">
                <tr>
                  <td class="info-label">IP Address:</td>
                  <td class="info-value">${booking.agreement_ip_address || 'Not recorded'}</td>
                </tr>
                ${booking.agreement_user_agent ? `
                <tr>
                  <td class="info-label">User Agent:</td>
                  <td class="info-value" style="font-size: 7pt;">${booking.agreement_user_agent}</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>
        </div>
      </div>
      ` : `
      <div class="section">
        <div class="section-title">Agreement Status</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Agreement Status:</td>
            <td class="info-value" style="font-weight: bold;">⏳ Pending Signature</td>
          </tr>
        </table>
      </div>
      `}

      ${auditTrail.length > 0 ? `
      <div class="section">
        <div class="section-title">Audit Trail</div>
        <table class="audit-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Method</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${auditTrail.map(entry => `
            <tr>
              <td>${formatDate(entry.timestamp)}</td>
              <td>${entry.action || 'N/A'}</td>
              <td>${entry.actor || 'System'}</td>
              <td>${entry.method || 'N/A'}</td>
              <td>${entry.details || 'N/A'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

        <div class="footer">
          <p><strong>T&S Bouncy Castle Hire</strong> - Booking Management System</p>
          <p>This report contains all available data for booking <span class="highlight-value">${booking.booking_ref}</span></p>
          <p>Document includes digital signature verification and audit trails for legal compliance</p>
        </div>
        
        </div> <!-- End content -->
      </div> <!-- End document -->
    </body>
    </html>
  `;
}