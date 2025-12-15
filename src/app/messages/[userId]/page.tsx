import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import ChatWindow from "@/components/chat-window";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function MessagePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ userId: string }>,
  searchParams: Promise<{ listingId?: string }> 
}) {
  const { userId } = await params;
  const { listingId } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const [otherUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!otherUser) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <header className="mb-4 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Mesajlar</h1>
      </header>

      <main className="max-w-2xl mx-auto">
        <ChatWindow 
          myId={session.user.id} 
          otherUserId={otherUser.id} 
          otherUserName={otherUser.name} 
          listingId={listingId}
        />
      </main>
    </div>
  );
}
