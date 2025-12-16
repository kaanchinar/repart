"use server";

import { db } from "@/db";
import { listings, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { ensureAdmin, logAdminAction } from "@/app/actions/admin-shared";

export async function setUserBan(userId: string, shouldBan: boolean, formData?: FormData) {
  void formData;
  const { adminRecord } = await ensureAdmin();

  await db
    .update(user)
    .set({ isBanned: shouldBan })
    .where(eq(user.id, userId));

  await logAdminAction(adminRecord.id, shouldBan ? "user.ban" : "user.unban", "user", userId);
  revalidatePath("/admin/users");
}

export async function updateUserRole(
  userId: string,
  role: "user" | "moderator" | "admin",
  formData?: FormData
) {
  void formData;
  const { adminRecord } = await ensureAdmin();

  await db
    .update(user)
    .set({ role })
    .where(eq(user.id, userId));

  await logAdminAction(adminRecord.id, "user.role", "user", userId, { role });
  revalidatePath("/admin/users");
}

export async function adjustTrustScore(userId: string, delta: number, formData?: FormData) {
  void formData;
  const { adminRecord } = await ensureAdmin();

  const current = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!current) {
    throw new Error("User not found");
  }

  const nextScore = Math.min(100, Math.max(0, (current.trustScore ?? 80) + delta));

  await db
    .update(user)
    .set({ trustScore: nextScore })
    .where(eq(user.id, userId));

  await logAdminAction(adminRecord.id, "user.trust", "user", userId, { delta, nextScore });
  revalidatePath("/admin/users");
}

export async function moderateListing(
  listingId: string,
  params: {
    status?: "active" | "sold" | "draft";
    moderationNotes?: string;
    riskScore?: number;
  },
  formData?: FormData
) {
  void formData;
  const { adminRecord } = await ensureAdmin();

  const updateData: {
    status?: "active" | "sold" | "draft";
    moderationNotes?: string;
    riskScore?: number;
  } = {};

  if (typeof params.status !== "undefined") {
    updateData.status = params.status;
  }

  if (typeof params.moderationNotes !== "undefined") {
    updateData.moderationNotes = params.moderationNotes;
  }

  if (typeof params.riskScore !== "undefined") {
    updateData.riskScore = Math.min(100, Math.max(0, params.riskScore));
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  await db
    .update(listings)
    .set(updateData)
    .where(eq(listings.id, listingId));

  await logAdminAction(adminRecord.id, "listing.moderate", "listing", listingId, updateData);
  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
}

export async function submitListingModeration(listingId: string, formData: FormData) {
  const status = formData.get("status") as "active" | "sold" | "draft" | null;
  const moderationNotes = formData.get("moderationNotes")?.toString() ?? undefined;
  const riskScoreValue = formData.get("riskScore");
  const riskScore = typeof riskScoreValue === "string" && riskScoreValue.length > 0 ? Number(riskScoreValue) : undefined;

  await moderateListing(listingId, {
    status: status ?? undefined,
    moderationNotes,
    riskScore,
  });
}
