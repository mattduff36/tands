import { NextResponse } from "next/server";
import { getCastles } from "@/lib/database/castles";
import { castles as staticCastles } from "@/lib/castle-data";

// Enable static generation with revalidation for better performance
// Reduced revalidation time to ensure new castles appear faster on public site
export const revalidate = 300; // Revalidate every 5 minutes

// GET - Public endpoint to fetch all castles for the main website
export async function GET() {
  try {
    // Try database first, fallback to static data if DB is unavailable
    let castles;
    try {
      castles = await getCastles();
      // Filter out castles that are out of service from public view
      // Maintenance castles can still be shown, but out_of_service should be hidden
      castles = castles.filter(
        (castle) =>
          (castle.maintenanceStatus || "available") !== "out_of_service",
      );
    } catch (dbError) {
      console.warn("Database unavailable, using static castle data:", dbError);
      castles = staticCastles;
    }

    // Create response with optimized caching headers for static data
    const response = NextResponse.json(castles);

    // Reduced cache time to 5 minutes to ensure new castles appear faster
    // This allows serving cached data while fetching fresh data in background
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, max-age=60, stale-while-revalidate=600",
    );
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300");
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300");

    return response;
  } catch (error) {
    console.error("Error fetching castles:", error);

    // Don't cache error responses
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch castles" },
      { status: 500 },
    );
    errorResponse.headers.set("Cache-Control", "no-store");
    return errorResponse;
  }
}
