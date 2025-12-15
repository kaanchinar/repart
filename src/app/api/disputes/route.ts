import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { disputes, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, videoProofUrl } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify order belongs to user (buyer)
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Only buyer can open a dispute" }, { status: 403 });
    }

    // Create dispute
    await db.transaction(async (tx) => {
      await tx.insert(disputes).values({
        orderId,
        reason,
        videoProofUrl: videoProofUrl || "",
        status: 'open'
      });

      // Update order status
      await tx
        .update(orders)
        .set({ escrowStatus: 'disputed' })
        .where(eq(orders.id, orderId));
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Dispute error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
