import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ADMIN_EMAILS } from "@/lib/admin-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function requireAdminSession(options: { allowModerator?: boolean } = {}) {
  const { allowModerator = true } = options;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const record = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  const allowedRoles = allowModerator ? ["admin", "moderator"] : ["admin"];
  const email = session.user.email?.toLowerCase();
  const hasEmailOverride = email ? ADMIN_EMAILS.includes(email) : false;

  if (!record || (!allowedRoles.includes(record.role) && !hasEmailOverride)) {
    redirect("/");
  }

  return { session, record };
}
