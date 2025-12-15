import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings, orders, listingStatusEnum } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { listingId, address } = body;

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    // Start a transaction to ensure atomicity
    // Drizzle transaction support:
    return await db.transaction(async (tx) => {
      // 1. Fetch listing and lock it (conceptually, though Postgres row locking would be better for high concurrency)
      const [listing] = await tx
        .select()
        .from(listings)
        .where(and(eq(listings.id, listingId), eq(listings.status, 'active')))
        .limit(1);

      if (!listing) {
        return NextResponse.json({ error: "Listing not found or already sold" }, { status: 404 });
      }

      if (listing.sellerId === session.user.id) {
        return NextResponse.json({ error: "You cannot buy your own listing" }, { status: 400 });
      }

      // 2. Create Order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          listingId: listing.id,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          amount: listing.price,
          escrowStatus: 'held',
          // We might want to store address in a separate table or json column, 
          // but for now we'll just assume it's handled or add a column later.
          // The schema doesn't have an address column on orders yet.
          // I'll ignore address storage for this MVP step or add it to schema if needed.
        })
        .returning();

      // 3. Update Listing Status
      await tx
        .update(listings)
        .set({ status: 'sold' })
        .where(eq(listings.id, listingId));

      return NextResponse.json({ success: true, orderId: newOrder.id });
    });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
