import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { listings, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ProfileForm from "./profile-form";
import AddressManager from "./address-manager";
import Link from "next/link";
import { formatAZN } from "@/lib/validators";
import { Package, ShoppingBag, ArrowRight } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const myListings = await db
    .select()
    .from(listings)
    .where(eq(listings.sellerId, session.user.id))
    .orderBy(desc(listings.createdAt));

  const myOrders = await db
    .select({
        id: orders.id,
        amount: orders.amount,
        status: orders.escrowStatus,
        createdAt: orders.createdAt,
        listingModel: listings.modelName,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .where(eq(orders.buyerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  const mySales = await db
    .select({
        id: orders.id,
        amount: orders.amount,
        status: orders.escrowStatus,
        createdAt: orders.createdAt,
        listingModel: listings.modelName,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .where(eq(orders.sellerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      <header className="p-4 border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-white">Hesabım</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-8">
        
        {/* Profile Settings */}
        <ProfileForm />

        {/* Address Management */}
        <AddressManager />

        {/* My Orders (Buying) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            Sifarişlərim (Aldıqlarım)
          </h2>
          {myOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Hələ heç nə almamısınız.</p>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-medium">{order.listingModel}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">{formatAZN(order.amount)}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                        order.status === 'held' ? 'bg-blue-900/30 text-blue-400' :
                        order.status === 'released' ? 'bg-green-900/30 text-green-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {order.status === 'held' ? 'Aktiv' : order.status === 'released' ? 'Tamamlandı' : 'Mübahisəli'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Sales (Selling Orders) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-500" />
            Satışlarım (Gələn Sifarişlər)
          </h2>
          {mySales.length === 0 ? (
            <p className="text-gray-500 text-sm">Hələ heç bir satışınız yoxdur.</p>
          ) : (
            <div className="space-y-3">
              {mySales.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-medium">{order.listingModel}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">+{formatAZN(order.amount)}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                        order.status === 'held' ? 'bg-blue-900/30 text-blue-400' :
                        order.status === 'released' ? 'bg-green-900/30 text-green-400' :
                        order.status === 'refunded' ? 'bg-red-900/30 text-red-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {order.status === 'held' ? 'Gözləmədə' : 
                         order.status === 'released' ? 'Ödənildi' : 
                         order.status === 'refunded' ? 'Qaytarıldı' : 
                         'Mübahisəli'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Listings (Selling) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-green-500" />
            Elanlarım (Satdıqlarım)
          </h2>
          {myListings.length === 0 ? (
            <p className="text-gray-500 text-sm">Hələ heç nə satmamısınız.</p>
          ) : (
            <div className="space-y-3">
              {myListings.map((item) => (
                <Link key={item.id} href={`/listings/${item.id}`} className="block">
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item.modelName}</div>
                      <div className="text-xs text-gray-500">IMEI: {item.imeiMasked}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{formatAZN(item.price)}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                        item.status === 'active' ? 'bg-green-900/30 text-green-400' :
                        item.status === 'sold' ? 'bg-gray-700 text-gray-300' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {item.status === 'active' ? 'Satışda' : item.status === 'sold' ? 'Satılıb' : 'Qaralama'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}