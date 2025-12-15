import { db } from "@/db";
import { cartItems, listings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { formatAZN } from "@/lib/validators";
import { RemoveFromCartButton } from "@/components/remove-from-cart-button";

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center flex-col gap-4">
        <p>Səbəti görmək üçün giriş etməlisiniz.</p>
        <Link href="/sign-in" className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">
          Giriş
        </Link>
      </div>
    );
  }

  const items = await db
    .select({
      id: cartItems.id,
      listing: listings,
    })
    .from(cartItems)
    .innerJoin(listings, eq(cartItems.listingId, listings.id))
    .where(eq(cartItems.userId, session.user.id))
    .orderBy(desc(cartItems.createdAt));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 pb-24">
      <header className="mb-6 flex items-center gap-4 sticky top-0 bg-gray-950/80 backdrop-blur-md py-4 z-10 border-b border-gray-800">
        <Link href="/" className="text-gray-400 hover:text-white">
          &larr; Geri
        </Link>
        <h1 className="text-xl font-bold">Səbət ({items.length})</h1>
      </header>

      <div className="space-y-4 max-w-md mx-auto">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Səbətiniz boşdur.
          </div>
        ) : (
          items.map(({ id, listing }) => (
            <div key={id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex gap-4">
              <div className="w-24 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                 {listing.photos && listing.photos.length > 0 ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={listing.photos[0]} alt={listing.modelName} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-600">📷</div>
                 )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium line-clamp-1">{listing.modelName}</h3>
                    <RemoveFromCartButton id={id} />
                  </div>
                  <div className="text-green-500 font-bold mt-1">
                    {formatAZN(listing.price)}
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link 
                    href={`/checkout/${listing.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500 w-full text-center"
                  >
                    Sifariş et
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
