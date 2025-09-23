import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { getPool } from "@/lib/database/connection";
//import { log } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await getPool().connect();

    try {
      console.log("Adding test booking to database");

      // Check if booking already exists
      const existingBooking = await client.query(
        "SELECT id FROM bookings WHERE booking_ref = $1",
        ["TS999"],
      );

      if (existingBooking.rows.length > 0) {
        return NextResponse.json({
          success: false,
          message: "Booking already exists with this reference",
          bookingId: existingBooking.rows[0].id,
        });
      }

      // Insert the test booking
      const result = await client.query(
        `
        INSERT INTO bookings (
          id, booking_ref, customer_name, customer_email, customer_phone, customer_address,
          castle_id, castle_name, date, payment_method, total_price, deposit, status,
          notes, created_at, updated_at, agreement_signed, agreement_signed_at, agreement_signed_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
      `,
        [
          11, // id
          "TS999", // booking_ref
          "Graham baguley", // customer_name
          "no@email.com", // customer_email
          "07966044671", // customer_phone
          "Bilsthorpe scout hut", // customer_address
          13, // castle_id
          "Emoji", // castle_name
          "2025-07-28", // date (extract date part from timestamp)
          "cash", // payment_method
          110, // total_price
          0, // deposit
          "confirmed", // status
          null, // notes
          "2025-07-27T07:32:08.399Z", // created_at
          "2025-07-27T11:12:22.742Z", // updated_at
          false, // agreement_signed
          null, // agreement_signed_at
          null, // agreement_signed_by
        ],
      );

      console.log("Test booking added successfully", { bookingRef: "TS999" });

      // Verify the booking was added
      const verifyResult = await client.query(
        "SELECT id, booking_ref, customer_name, status FROM bookings WHERE booking_ref = $1",
        ["TS999"],
      );

      return NextResponse.json({
        success: true,
        message: "Test booking added successfully",
        booking: verifyResult.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error adding test booking:", error);
    return NextResponse.json(
      {
        error: "Failed to add test booking",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
