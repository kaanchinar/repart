"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  deviceCatalogEntries,
  deviceCategories,
  orders,
  payouts,
  systemNotifications,
  systemNotificationRecipients,
  user,
} from "@/db/schema";
import { ensureAdmin, logAdminAction } from "@/app/actions/admin-shared";
import { slugify } from "@/lib/utils";
import { sendOtpMessage } from "@/lib/twilio";

export async function upsertDeviceCatalogEntry(formData: FormData) {
  const { adminRecord } = await ensureAdmin();
  const entryId = formData.get("entryId")?.toString();

  const basePrice = Number(formData.get("basePrice") ?? "0");
  const floorPrice = Number(formData.get("floorPrice") ?? "0");

  const payload = {
    deviceType: (formData.get("deviceType") as "phone" | "computer" | "tablet") ?? "phone",
    brand: formData.get("brand")?.toString().trim() ?? "",
    model: formData.get("model")?.toString().trim() ?? "",
    chipset: formData.get("chipset")?.toString().trim() || null,
    storage: formData.get("storage")?.toString().trim() || null,
    ram: formData.get("ram")?.toString().trim() || null,
    basePrice,
    floorPrice,
    status: (formData.get("status") as "active" | "draft" | "archived") ?? "active",
    isFeatured: formData.get("isFeatured") === "on",
    notes: formData.get("notes")?.toString().trim() || null,
  };

  if (!payload.brand || !payload.model) {
    throw new Error("Brand və model məcburidir");
  }

  if (payload.floorPrice > payload.basePrice) {
    throw new Error("Floor price base qiymətdən çox ola bilməz");
  }

  if (entryId) {
    await db.update(deviceCatalogEntries).set(payload).where(eq(deviceCatalogEntries.id, entryId));
    await logAdminAction(adminRecord.id, "catalog.update", "device_catalog", entryId, payload);
  } else {
    await db.insert(deviceCatalogEntries).values(payload);
    await logAdminAction(adminRecord.id, "catalog.create", "device_catalog", undefined, payload);
  }

  revalidatePath("/admin/devices");
}

export async function updateDeviceEntryStatus(entryId: string, status: "active" | "draft" | "archived") {
  const { adminRecord } = await ensureAdmin();
  await db
    .update(deviceCatalogEntries)
    .set({ status })
    .where(eq(deviceCatalogEntries.id, entryId));

  await logAdminAction(adminRecord.id, "catalog.status", "device_catalog", entryId, { status });
  revalidatePath("/admin/devices");
}

export async function toggleDeviceFeatured(entryId: string, nextFeatured: boolean) {
  const { adminRecord } = await ensureAdmin();
  await db
    .update(deviceCatalogEntries)
    .set({ isFeatured: nextFeatured })
    .where(eq(deviceCatalogEntries.id, entryId));

  await logAdminAction(adminRecord.id, "catalog.featured", "device_catalog", entryId, { isFeatured: nextFeatured });
  revalidatePath("/admin/devices");
}

export async function deleteDeviceEntry(entryId: string) {
  const { adminRecord } = await ensureAdmin();
  await db.delete(deviceCatalogEntries).where(eq(deviceCatalogEntries.id, entryId));
  await logAdminAction(adminRecord.id, "catalog.delete", "device_catalog", entryId);
  revalidatePath("/admin/devices");
}

export async function upsertDeviceCategory(formData: FormData) {
  const { adminRecord } = await ensureAdmin();
  const categoryId = formData.get("categoryId")?.toString();
  const label = formData.get("label")?.toString().trim() ?? "";
  const manualSlug = formData.get("slug")?.toString().trim();

  if (!label) {
    throw new Error("Kateqoriya adı vacibdir");
  }

  const values = {
    label,
    slug: manualSlug ? slugify(manualSlug) : slugify(label),
    description: formData.get("description")?.toString().trim() || null,
    deviceType: (formData.get("categoryDeviceType") as "phone" | "computer" | "tablet") ?? "phone",
    isActive: formData.get("isActive") === "on" || !categoryId,
  };

  if (categoryId) {
    await db.update(deviceCategories).set(values).where(eq(deviceCategories.id, categoryId));
    await logAdminAction(adminRecord.id, "category.update", "device_category", categoryId, values);
  } else {
    await db.insert(deviceCategories).values(values);
    await logAdminAction(adminRecord.id, "category.create", "device_category", undefined, values);
  }

  revalidatePath("/admin/devices");
}

export async function toggleCategoryActive(categoryId: string, isActive: boolean) {
  const { adminRecord } = await ensureAdmin();
  await db.update(deviceCategories).set({ isActive }).where(eq(deviceCategories.id, categoryId));
  await logAdminAction(adminRecord.id, "category.toggle", "device_category", categoryId, { isActive });
  revalidatePath("/admin/devices");
}

export async function deleteDeviceCategory(categoryId: string) {
  const { adminRecord } = await ensureAdmin();
  await db.delete(deviceCategories).where(eq(deviceCategories.id, categoryId));
  await logAdminAction(adminRecord.id, "category.delete", "device_category", categoryId);
  revalidatePath("/admin/devices");
}

export async function releaseEscrow(orderId: string, note?: string) {
  const { adminRecord } = await ensureAdmin({ allowModerator: false });
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.escrowStatus === "released") {
    return;
  }

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ escrowStatus: "released" }).where(eq(orders.id, orderId));
    await tx.insert(payouts).values({
      orderId,
      amount: order.amount,
      type: "seller_release",
      status: "processed",
      processedBy: adminRecord.id,
      note: note || "Manual release",
    });
  });

  await logAdminAction(adminRecord.id, "finance.release", "order", orderId, { note });
  revalidatePath("/admin/financials");
}

export async function refundEscrow(orderId: string, note?: string) {
  const { adminRecord } = await ensureAdmin({ allowModerator: false });
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.escrowStatus === "refunded") {
    return;
  }

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ escrowStatus: "refunded" }).where(eq(orders.id, orderId));
    await tx.insert(payouts).values({
      orderId,
      amount: order.amount,
      type: "buyer_refund",
      status: "processed",
      processedBy: adminRecord.id,
      note: note || "Manual refund",
    });
  });

  await logAdminAction(adminRecord.id, "finance.refund", "order", orderId, { note });
  revalidatePath("/admin/financials");
}

async function resolveAudience(audience: "all" | "buyers" | "sellers") {
  if (audience === "buyers") {
    const buyerIds = await db.selectDistinct({ id: orders.buyerId }).from(orders).orderBy(desc(orders.createdAt));
    const ids = buyerIds.map((row) => row.id).filter(Boolean);
    if (!ids.length) return [];
    return db.select().from(user).where(inArray(user.id, ids));
  }

  if (audience === "sellers") {
    const sellerIds = await db.selectDistinct({ id: orders.sellerId }).from(orders).orderBy(desc(orders.createdAt));
    const ids = sellerIds.map((row) => row.id).filter(Boolean);
    if (!ids.length) return [];
    return db.select().from(user).where(inArray(user.id, ids));
  }

  return db.select().from(user).limit(200);
}

async function deliverNotification(
  notification: typeof systemNotifications.$inferSelect,
  actorId: string,
) {
  const recipients = await resolveAudience(notification.audience as "all" | "buyers" | "sellers");
  if (!recipients.length) {
    await db
      .update(systemNotifications)
      .set({ status: "sent", sentCount: 0, lastSentAt: new Date() })
      .where(eq(systemNotifications.id, notification.id));
    await logAdminAction(actorId, "notification.send", "notification", notification.id, { sent: 0 });
    return 0;
  }

  const rows: (typeof systemNotificationRecipients.$inferInsert)[] = [];
  let sentCount = 0;

  for (const target of recipients) {
    const canSms = (notification.channel === "sms" || notification.channel === "both")
      && Boolean(target.phoneNumber)
      && Boolean(target.phoneNumberVerified);

    if (canSms && target.phoneNumber) {
      try {
        await sendOtpMessage({ to: target.phoneNumber, body: `${notification.title}: ${notification.message}` });
      } catch (error) {
        console.error("Failed to send SMS", error);
        rows.push({ notificationId: notification.id, userId: target.id, deliveryStatus: "failed" });
        continue;
      }
    }

    rows.push({ notificationId: notification.id, userId: target.id, deliveryStatus: "sent" });
    sentCount += 1;
  }

  if (rows.length) {
    await db.insert(systemNotificationRecipients).values(rows);
  }

  await db
    .update(systemNotifications)
    .set({ status: "sent", sentCount, lastSentAt: new Date() })
    .where(eq(systemNotifications.id, notification.id));

  await logAdminAction(actorId, "notification.send", "notification", notification.id, {
    sent: sentCount,
    channel: notification.channel,
    audience: notification.audience,
  });

  return sentCount;
}

export async function handleNotificationForm(formData: FormData) {
  const { adminRecord } = await ensureAdmin();
  const intent = (formData.get("intent") as "draft" | "send") ?? "draft";
  const notificationId = formData.get("notificationId")?.toString();
  const title = formData.get("title")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";
  const channel = (formData.get("channel") as "push" | "sms" | "both") ?? "push";
  const audience = (formData.get("audience") as "all" | "buyers" | "sellers") ?? "all";

  if (!title || !message) {
    throw new Error("Məzmun boş ola bilməz");
  }

  let record;
  if (notificationId) {
    const [updated] = await db
      .update(systemNotifications)
      .set({ title, message, channel, audience, status: intent === "send" ? "sent" : "draft" })
      .where(eq(systemNotifications.id, notificationId))
      .returning();
    record = updated;
  } else {
    const [created] = await db
      .insert(systemNotifications)
      .values({ title, message, channel, audience, status: intent === "send" ? "sent" : "draft", createdBy: adminRecord.id })
      .returning();
    record = created;
  }

  if (!record) {
    throw new Error("Notification not found");
  }

  if (intent === "send") {
    await deliverNotification(record, adminRecord.id);
  } else {
    await logAdminAction(adminRecord.id, "notification.draft", "notification", record.id);
  }

  revalidatePath("/admin/notifications");
}
