import { auth } from "@/lib/auth";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, session.user.id));

  return NextResponse.json(userAddresses);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, addressLine, city, zipCode, isDefault } = body;

  if (!title || !addressLine || !city) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  // If setting as default, unset others
  if (isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, session.user.id));
  }

  await db.insert(addresses).values({
    userId: session.user.id,
    title,
    addressLine,
    city,
    zipCode,
    isDefault: isDefault || false,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
