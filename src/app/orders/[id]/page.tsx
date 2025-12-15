import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, listings, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatAZN } from "@/lib/validators";
import Link from "next/link";
import { ArrowLeft, Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import OrderActions from "./order-actions";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/sign-in?callbackUrl=/orders/${id}`);
  }

  const [orderData] = await db
    .select({
      order: orders,
      listing: listings,
      buyer: { name: user.name, email: user.email }, // We might need to join twice for buyer and seller, Drizzle syntax for aliased joins is a bit verbose, let's do simple joins or separate queries if needed.
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(user, eq(orders.buyerId, user.id)) // This gets buyer info
    .where(eq(orders.id, id))
    .limit(1);

  if (!orderData) {
    notFound();
  }

  const { order, listing } = orderData;
  
  // Lazy Check for 24h Auto-Release
  if (order.escrowStatus === 'held' && order.deliveredAt) {
    const deliveredTime = new Date(order.deliveredAt).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - deliveredTime) / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      await db.update(orders).set({ escrowStatus: 'released' }).where(eq(orders.id, id));
      order.escrowStatus = 'released'; // Update local object for rendering
    }
  }

  // We need to know if current user is buyer or seller
  const isBuyer = session.user.id === order.buyerId;
  const isSeller = session.user.id === order.sellerId;

  if (!isBuyer && !isSeller) {
    return <div className="p-4 text-center">Sizin bu sifarişə baxmaq icazəniz yoxdur.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      <header className="p-4 border-b border-gray-800 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-lg">Sifariş #{order.id.slice(0, 8)}</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          order.escrowStatus === 'held' ? 'bg-blue-950/30 border-blue-900/50 text-blue-200' :
          order.escrowStatus === 'released' ? 'bg-green-950/30 border-green-900/50 text-green-200' :
          'bg-red-950/30 border-red-900/50 text-red-200'
        }`}>
          {order.escrowStatus === 'held' && <Clock className="w-6 h-6" />}
          {order.escrowStatus === 'released' && <CheckCircle className="w-6 h-6" />}
          {order.escrowStatus === 'disputed' && <AlertTriangle className="w-6 h-6" />}
          
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide opacity-80">Status</h2>
            <p className="font-medium text-lg">
              {order.escrowStatus === 'held' && 'Vəsait Saxlanılır'}
              {order.escrowStatus === 'released' && 'Tamamlandı'}
              {order.escrowStatus === 'disputed' && 'Mübahisəli'}
              {order.escrowStatus === 'refunded' && 'Qaytarıldı'}
            </p>
          </div>
        </div>

        {/* 24h Timer Banner */}
        {order.escrowStatus === 'held' && order.deliveredAt && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="font-bold text-yellow-500">Yoxlama Müddəti Aktivdir</h3>
              <p className="text-xs text-gray-400">
                Məhsul çatdırılıb. 24 saat ərzində problem bildirilməzsə, vəsait avtomatik satıcıya köçürüləcək.
              </p>
              <p className="text-sm font-mono mt-1 text-yellow-200">
                Çatdırılma vaxtı: {new Date(order.deliveredAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Item Details */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center text-xl">
            📷
          </div>
          <div>
            <h3 className="font-medium">{listing.modelName}</h3>
            <div className="text-green-500 font-bold">{formatAZN(order.amount)}</div>
          </div>
        </div>

        {/* Role Specific Info */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Rolunuz</h3>
          <div className="font-semibold text-lg flex items-center gap-2">
            {isBuyer ? 'Alıcı' : 'Satıcı'}
          </div>
          <p className="text-xs text-gray-500">
            {isBuyer 
              ? 'Siz məhsulu təhvil aldıqdan sonra "Təsdiqlə" düyməsini sıxmalısınız.' 
              : 'Məhsulu kuryerə təhvil verin və izləmə kodunu daxil edin.'}
          </p>
        </div>

        {/* Actions Component */}
        <OrderActions 
          order={order} 
          isBuyer={isBuyer} 
          isSeller={isSeller} 
        />

      </main>
    </div>
  );
}