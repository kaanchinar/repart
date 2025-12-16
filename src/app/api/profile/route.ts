import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { phone, phoneNumber } = body;
  const normalizedPhone = phoneNumber ?? phone;

  try {
    await db.update(user)
      .set({ 
        phoneNumber: normalizedPhone 
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update failed", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
