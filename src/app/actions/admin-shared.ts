"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { adminAuditLogs, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_EMAILS } from "@/lib/admin-roles";

type EnsureAdminOptions = {
  allowModerator?: boolean;
};

export async function ensureAdmin({ allowModerator = true }: EnsureAdminOptions = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const adminRecord = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  const allowedRoles = allowModerator ? ["admin", "moderator"] : ["admin"];
  const email = session.user.email?.toLowerCase();
  const hasEmailOverride = email ? ADMIN_EMAILS.includes(email) : false;

  if (!adminRecord || (!allowedRoles.includes(adminRecord.role) && !hasEmailOverride)) {
    throw new Error("Forbidden");
  }

  return { session, adminRecord };
}

export async function logAdminAction(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(adminAuditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    metadata,
  });
}
