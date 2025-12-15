import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { modelName, faultTree, imei, price, photos } = body;

  // Mask IMEI (Show first 3, last 3)
  const imeiMasked = imei.length === 15 
    ? `${imei.slice(0, 3)}***${imei.slice(-3)}` 
    : imei;

  try {
    await db.insert(listings).values({
      sellerId: session.user.id,
      modelName,
      faultTree,
      imeiMasked,
      imeiEncrypted: imei, // In real app, encrypt this field!
      price,
      photos: photos || [],
      status: 'active'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const allListings = await db.select().from(listings).orderBy(listings.createdAt);
    return NextResponse.json(allListings);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
