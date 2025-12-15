"use server";

import { db } from "@/db";
import { disputes, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function resolveDispute(disputeId: string, resolution: "refund" | "payout") {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // In a real app, verify admin role here

  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.id, disputeId),
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (resolution === "refund") {
    await db.transaction(async (tx) => {
      await tx
        .update(disputes)
        .set({ status: "resolved_refund" })
        .where(eq(disputes.id, disputeId));
      
      await tx
        .update(orders)
        .set({ escrowStatus: "refunded" })
        .where(eq(orders.id, dispute.orderId));
    });
  } else if (resolution === "payout") {
    await db.transaction(async (tx) => {
      await tx
        .update(disputes)
        .set({ status: "resolved_payout" })
        .where(eq(disputes.id, disputeId));
      
      await tx
        .update(orders)
        .set({ escrowStatus: "released" })
        .where(eq(orders.id, dispute.orderId));
    });
  }

  revalidatePath("/admin/disputes");
  revalidatePath(`/admin/disputes/${disputeId}`);
  redirect("/admin/disputes");
}
