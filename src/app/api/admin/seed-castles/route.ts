import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth-helpers";

import { query } from "@/lib/database/connection";
import { addCastle } from "@/lib/database/castles";
import fs from "fs";
import path from "path";
//import { log } from '@/lib/utils/logger';

/**
 * POST /api/admin/seed-castles
 * Seed castle data from JSON file
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Starting castle seeding");

    // Check if castles already exist
    const existingCastles = await query("SELECT COUNT(*) FROM castles");
    const count = parseInt(existingCastles.rows[0].count);

    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already has ${count} castles`,
      });
    }

    // Read castle data from JSON file
    const dataPath = path.join(process.cwd(), "data", "castles.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const castles = JSON.parse(rawData);

    console.log("Castles found for seeding", { count: castles.length });

    // Add castles to database
    for (const castle of castles) {
      const { id, ...castleData } = castle; // Remove id to let DB auto-increment
      await addCastle(castleData);
      console.log("Castle seeded successfully", { name: castleData.name });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${castles.length} castles`,
    });
  } catch (error: any) {
    console.error("Error seeding castles:", error);
    return NextResponse.json(
      {
        error: "Failed to seed castles",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
