import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { or, and, eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  console.log("GET /api/messages called");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.log("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get("userId");
  console.log(`Fetching messages for user: ${session.user.id}, otherUser: ${otherUserId}`);

  if (otherUserId) {
    // Fetch conversation with specific user
    const conversation = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, session.user.id), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, session.user.id))
        )
      )
      .orderBy(desc(messages.createdAt));
    
    return NextResponse.json(conversation);
  } else {
    // Fetch all recent messages (inbox view - simplified)
    // In a real app, we'd group by conversation partner
    const myMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, session.user.id), eq(messages.receiverId, session.user.id)))
      .orderBy(desc(messages.createdAt));

    return NextResponse.json(myMessages);
  }
}

export async function POST(req: Request) {
  console.log("POST /api/messages called");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.log("Unauthorized POST attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Message body:", body);
    const { receiverId, content, listingId } = body;

    if (!receiverId || !content) {
      console.log("Missing fields");
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newMessage = await db.insert(messages).values({
      senderId: session.user.id,
      receiverId,
      content,
      listingId,
    }).returning();

    console.log("Message created:", newMessage);
    return NextResponse.json(newMessage[0]);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
