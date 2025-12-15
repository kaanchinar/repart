import { db } from "@/db";
import { cartItems, listings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const items = await db
    .select({
      id: cartItems.id,
      listingId: cartItems.listingId,
      listing: listings,
    })
    .from(cartItems)
    .innerJoin(listings, eq(cartItems.listingId, listings.id))
    .where(eq(cartItems.userId, session.user.id));

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { listingId } = await req.json();

  if (!listingId) {
    return new NextResponse("Listing ID required", { status: 400 });
  }

  // Check if already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.listingId, listingId), eq(cartItems.userId, session.user.id)));

  if (existing.length > 0) {
    return NextResponse.json({ message: "Item already in cart" }, { status: 409 });
  }

  await db.insert(cartItems).values({
    userId: session.user.id,
    listingId,
  });

  return NextResponse.json({ success: true });
}
