import { notFound } from "next/navigation";
import { db } from "@/db";
import { listings, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatAZN } from "@/lib/validators";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck, AlertTriangle, CheckCircle2, MessageCircle, ShoppingCart } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CartButton } from "@/components/cart-button";

export const dynamic = 'force-dynamic';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [data] = await db
    .select({
      listing: listings,
      seller: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      }
    })
    .from(listings)
    .leftJoin(user, eq(listings.sellerId, user.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!data) {
    notFound();
  }

  const { listing, seller } = data;
  const isOwner = session?.user?.id === seller?.id;

  // Parse fault tree for display
  const faults = Object.entries(listing.faultTree).map(([part, status]) => ({
    part: part.charAt(0).toUpperCase() + part.slice(1),
    status: status as string,
    isBroken: status === 'broken' || status === 'faulty',
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-40">
      {/* Header */}
      <header className="p-4 border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-md z-10 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg truncate flex-1">{listing.modelName}</h1>
        <Link href="/cart" className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
          <ShoppingCart className="w-5 h-5" />
        </Link>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Image Gallery */}
        <div className="space-y-2">
          <div className="aspect-square bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden">
            {listing.photos && listing.photos.length > 0 ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={listing.photos[0]} alt={listing.modelName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-600 flex flex-col items-center gap-2">
                <span className="text-4xl">📷</span>
                <span className="text-sm">Şəkil yoxdur</span>
              </div>
            )}
            {listing.photos && listing.photos.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                1/{listing.photos.length}
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {listing.photos && listing.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.photos.map((photo, idx) => (
                <div key={idx} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`View ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price & Title */}
        <div>
          <h2 className="text-2xl font-bold mb-1">{listing.modelName}</h2>
          <div className="text-3xl font-bold text-green-500">{formatAZN(listing.price)}</div>
        </div>

        {/* Seller Info */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
              {seller?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-medium">{seller?.name || 'Naməlum Satıcı'}</div>
              <div className="text-xs text-gray-500">RePart üzvü</div>
            </div>
          </div>
          
          {!isOwner && seller?.id && (
            <Link 
              href={session ? `/messages/${seller.id}?listingId=${listing.id}` : '/sign-in'}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
              title="Satıcıya yaz"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Condition Report */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Vəziyyət Hesabatı
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {faults.map((f) => (
              <div 
                key={f.part} 
                className={`p-3 rounded-lg border ${
                  f.isBroken 
                    ? 'bg-red-950/20 border-red-900/50 text-red-200' 
                    : 'bg-green-950/20 border-green-900/50 text-green-200'
                }`}
              >
                <div className="text-xs opacity-70 mb-1">{f.part}</div>
                <div className="font-medium flex items-center gap-1">
                  {f.isBroken ? (
                    <><AlertTriangle className="w-3 h-3" /> Nasaz</>
                  ) : (
                    <><CheckCircle2 className="w-3 h-3" /> İşlək</>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 bg-gray-900 p-3 rounded border border-gray-800">
            IMEI: {listing.imeiMasked}
          </div>
        </div>

        {/* Guarantees */}
        <div className="space-y-3 pt-4 border-t border-gray-800">
          <div className="flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">RePart Zəmanəti</h4>
              <p className="text-xs text-gray-400">Məhsul təsvirə uyğun gəlməzsə, pulunuz geri qaytarılır.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Truck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Təhlükəsiz Çatdırılma</h4>
              <p className="text-xs text-gray-400">Kuryer vasitəsilə qapınıza qədər.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      {!isOwner && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gray-950 border-t border-gray-800 flex gap-3 items-center z-40">
          <div className="hidden sm:block">
            <div className="text-xs text-gray-400">Yekun qiymət</div>
            <div className="font-bold text-lg">{formatAZN(listing.price)}</div>
          </div>
          
          <Link 
            href={session ? `/messages/${seller?.id}?listingId=${listing.id}&offer=true` : '/sign-in'}
            className="flex-1"
          >
            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-gray-700">
              Təklif
            </button>
          </Link>

          <div className="flex-1">
            <CartButton listingId={listing.id} className="w-full" />
          </div>

          <Link href={`/checkout/${listing.id}`} className="flex-1">
              <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition-colors">
              İndi Al
              </button>
          </Link>
        </div>
      )}
    </div>
  );
}