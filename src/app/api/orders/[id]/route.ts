import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, trackingCode } = body;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Action Handlers
    if (action === 'add_tracking') {
      if (order.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Only seller can add tracking" }, { status: 403 });
      }
      
      // Auto-generate if not provided (Simulating Cargo API)
      const finalTrackingCode = trackingCode || `AZ-${Math.floor(Math.random() * 1000000000)}`;

      await db
        .update(orders)
        .set({ cargoTrackingCode: finalTrackingCode })
        .where(eq(orders.id, id));
        
      return NextResponse.json({ success: true, trackingCode: finalTrackingCode });
    }

    if (action === 'confirm_delivery') {
      if (order.buyerId !== session.user.id) {
        return NextResponse.json({ error: "Only buyer can confirm delivery" }, { status: 403 });
      }

      await db
        .update(orders)
        .set({ 
          deliveredAt: new Date(),
          // We do NOT release funds yet. 24h timer starts now.
        })
        .where(eq(orders.id, id));

      return NextResponse.json({ success: true });
    }

    if (action === 'release_funds') {
      if (order.buyerId !== session.user.id) {
        return NextResponse.json({ error: "Only buyer can release funds" }, { status: 403 });
      }

      await db
        .update(orders)
        .set({ escrowStatus: 'released' })
        .where(eq(orders.id, id));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
