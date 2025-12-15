
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { messages, user } from "@/db/schema";
import { eq, or, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

export default async function MessagesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const myId = session.user.id;

  // Fetch all messages involving the current user
  const allMessages = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      content: messages.content,
      createdAt: messages.createdAt,
      isRead: messages.isRead,
      senderName: user.name,
      senderImage: user.image,
    })
    .from(messages)
    .leftJoin(user, eq(messages.senderId, user.id))
    .where(or(eq(messages.senderId, myId), eq(messages.receiverId, myId)))
    .orderBy(desc(messages.createdAt));

  // Group messages by conversation partner
  const conversationsMap = new Map();

  for (const msg of allMessages) {
    const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId;
    
    if (!conversationsMap.has(partnerId)) {
      // Need to fetch partner details if they were the receiver (and thus not joined in the query above correctly for the partner name)
      // Actually, the query joins `user` on `senderId`. 
      // If I am the sender, the joined user is ME. 
      // If I am the receiver, the joined user is the SENDER (partner).
      
      let partnerName = "Unknown";
      let partnerImage = null;

      if (msg.senderId !== myId) {
        partnerName = msg.senderName || "Unknown";
        partnerImage = msg.senderImage;
      } else {
        // If I am the sender, I need to fetch the receiver's name. 
        // Optimization: We could do a better query, but for now let's just fetch user details if missing.
        // Or better, let's just store the latest message and fetch users later.
      }

      conversationsMap.set(partnerId, {
        partnerId,
        lastMessage: msg,
        partnerName, 
        partnerImage
      });
    }
  }

  // Fetch details for partners where I was the sender (so we didn't get their name from the join)
  const partnerIdsToFetch = Array.from(conversationsMap.values())
    .filter(c => c.partnerName === "Unknown")
    .map(c => c.partnerId);

  if (partnerIdsToFetch.length > 0) {
    const partners = await db
      .select()
      .from(user)
      .where(sql`${user.id} IN ${partnerIdsToFetch}`);
    
    for (const p of partners) {
      const conv = conversationsMap.get(p.id);
      if (conv) {
        conv.partnerName = p.name;
        conv.partnerImage = p.image;
      }
    }
  }

  const conversations = Array.from(conversationsMap.values());

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 pb-20">
      <header className="mb-6 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Mesajlar</h1>
      </header>

      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Heç bir mesaj yoxdur
          </div>
        ) : (
          conversations.map((conv) => (
            <Link 
              key={conv.partnerId} 
              href={`/messages/${conv.partnerId}`}
              className="block bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                  {conv.partnerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.partnerImage} alt={conv.partnerName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium truncate">{conv.partnerName}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {conv.lastMessage.senderId === myId && <span className="text-gray-500">Siz: </span>}
                    {conv.lastMessage.content}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
