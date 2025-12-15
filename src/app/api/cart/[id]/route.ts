import { db } from "@/db";
import { cartItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
