import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatAZN } from "@/lib/validators";
import CheckoutClient from "./checkout-client";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/sign-in?callbackUrl=/checkout/${id}`);
  }

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) {
    notFound();
  }

  if (listing.status !== 'active') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Bu məhsul artıq satılıb</h1>
        <Link href="/" className="text-green-500 hover:underline">Ana səhifəyə qayıt</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      <header className="p-4 border-b border-gray-800 flex items-center gap-4">
        <Link href={`/listings/${id}`} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">Sifarişi Rəsmiləşdir</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex gap-4">
          <div className="w-20 h-20 bg-gray-800 rounded-md flex items-center justify-center text-2xl">
            📷
          </div>
          <div>
            <h2 className="font-medium text-lg">{listing.modelName}</h2>
            <div className="text-green-500 font-bold">{formatAZN(listing.price)}</div>
            <div className="text-xs text-gray-500 mt-1">IMEI: {listing.imeiMasked}</div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-xl flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-200">Təhlükəsiz Ödəniş (Escrow)</h3>
            <p className="text-xs text-blue-300/70 mt-1">
              Ödənişiniz bizdə saxlanılır. Məhsulu təhvil alıb yoxladıqdan sonra satıcıya köçürülür.
            </p>
          </div>
        </div>

        <CheckoutClient listing={listing} />
      </main>
    </div>
  );
}