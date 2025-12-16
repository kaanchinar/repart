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
  const { modelName, faultTree, imei, price, photos, brand, deviceType, conditionSummary, riskScore } = body;

  const maskIdentifier = (value: string) => {
    if (!value) return "";
    if (value.length <= 6) return value;
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
  };

  const imeiMasked = maskIdentifier(imei ?? "");

  try {
    await db.insert(listings).values({
      sellerId: session.user.id,
      modelName,
      brand: brand || "Unknown",
      deviceType: deviceType || "phone",
      faultTree,
      imeiMasked,
      imeiEncrypted: imei ?? "", // In real app, encrypt this field!
      price,
      photos: photos || [],
      conditionSummary,
      riskScore: riskScore ?? 50,
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
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
