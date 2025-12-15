
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, listings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { formatAZN } from "@/lib/validators";

export default async function OrdersListPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const myPurchases = await db
    .select({
      order: orders,
      listing: listings,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .where(eq(orders.buyerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  const mySales = await db
    .select({
      order: orders,
      listing: listings,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .where(eq(orders.sellerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 pb-20">
      <header className="mb-6 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Sifarişlərim</h1>
      </header>

      <div className="space-y-8">
        {/* Purchases */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
            <ShoppingBag className="w-5 h-5" />
            Aldıqlarım
          </h2>
          <div className="space-y-3">
            {myPurchases.length === 0 ? (
              <div className="text-gray-500 text-sm bg-gray-900 p-4 rounded-xl border border-gray-800">
                Hələ heç nə almamısınız.
              </div>
            ) : (
              myPurchases.map(({ order, listing }) => (
                <Link 
                  key={order.id} 
                  href={`/orders/${order.id}`}
                  className="block bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{listing.modelName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.escrowStatus === 'released' ? 'bg-green-900/50 text-green-400' :
                      order.escrowStatus === 'refunded' ? 'bg-red-900/50 text-red-400' :
                      order.escrowStatus === 'disputed' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {order.escrowStatus === 'released' ? 'Tamamlandı' : 
                       order.escrowStatus === 'refunded' ? 'Ləğv edildi' : 
                       order.escrowStatus === 'disputed' ? 'Mübahisəli' : 'Aktiv'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-sm">
                    <div className="text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="font-bold text-green-500">
                      {formatAZN(order.amount)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Sales */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-400">
            <Package className="w-5 h-5" />
            Satdıqlarım
          </h2>
          <div className="space-y-3">
            {mySales.length === 0 ? (
              <div className="text-gray-500 text-sm bg-gray-900 p-4 rounded-xl border border-gray-800">
                Hələ heç nə satmamısınız.
              </div>
            ) : (
              mySales.map(({ order, listing }) => (
                <Link 
                  key={order.id} 
                  href={`/orders/${order.id}`}
                  className="block bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{listing.modelName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.escrowStatus === 'released' ? 'bg-green-900/50 text-green-400' :
                      order.escrowStatus === 'refunded' ? 'bg-red-900/50 text-red-400' :
                      order.escrowStatus === 'disputed' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {order.escrowStatus === 'released' ? 'Tamamlandı' : 
                       order.escrowStatus === 'refunded' ? 'Ləğv edildi' : 
                       order.escrowStatus === 'disputed' ? 'Mübahisəli' : 'Aktiv'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-sm">
                    <div className="text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="font-bold text-blue-500">
                      {formatAZN(order.amount)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
