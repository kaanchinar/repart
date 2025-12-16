"use server";

import { db } from "@/db";
import { disputes, orders, payouts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdmin, logAdminAction } from "@/app/actions/admin-shared";

export async function resolveDispute(disputeId: string, resolution: "refund" | "payout") {
  const { adminRecord } = await ensureAdmin({ allowModerator: false });

  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.id, disputeId),
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, dispute.orderId) });
  if (!order) {
    throw new Error("Order not found");
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

      await tx.insert(payouts).values({
        orderId: order.id,
        amount: order.amount,
        type: "buyer_refund",
        status: "processed",
        processedBy: adminRecord.id,
        note: "Dispute refund",
      });
    });

    await logAdminAction(adminRecord.id, "dispute.refund", "dispute", disputeId, { orderId: order.id });
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

      await tx.insert(payouts).values({
        orderId: order.id,
        amount: order.amount,
        type: "seller_release",
        status: "processed",
        processedBy: adminRecord.id,
        note: "Dispute payout",
      });
    });

    await logAdminAction(adminRecord.id, "dispute.payout", "dispute", disputeId, { orderId: order.id });
  }

  revalidatePath("/admin/disputes");
  revalidatePath(`/admin/disputes/${disputeId}`);
  redirect("/admin/disputes");
}
