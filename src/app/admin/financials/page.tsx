import { db } from "@/db";
import { listings, orders, payouts, user } from "@/db/schema";
import { desc, inArray, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAdminSession } from "@/lib/admin-session";
import { formatAZN } from "@/lib/validators";
import { refundEscrow, releaseEscrow } from "@/app/actions/admin-system";

export const dynamic = "force-dynamic";

export default async function AdminFinancialsPage() {
  await requireAdminSession();

  const buyer = alias(user, "buyer");
  const seller = alias(user, "seller");

  const [pendingEscrow, payoutHistory] = await Promise.all([
    db
      .select({
        orderId: orders.id,
        amount: orders.amount,
        escrowStatus: orders.escrowStatus,
        createdAt: orders.createdAt,
        buyerName: buyer.name,
        sellerName: seller.name,
        listingModel: listings.modelName,
      })
      .from(orders)
      .innerJoin(listings, eq(orders.listingId, listings.id))
      .leftJoin(buyer, eq(orders.buyerId, buyer.id))
      .leftJoin(seller, eq(orders.sellerId, seller.id))
      .where(inArray(orders.escrowStatus, ["held", "disputed"]))
      .orderBy(desc(orders.createdAt))
      .limit(25),
    db
      .select({
        id: payouts.id,
        orderId: payouts.orderId,
        amount: payouts.amount,
        type: payouts.type,
        status: payouts.status,
        processedAt: payouts.processedAt,
      })
      .from(payouts)
      .orderBy(desc(payouts.processedAt))
      .limit(25),
  ]);

  const heldTotal = pendingEscrow.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const todaysPayouts = payoutHistory.filter((row) => row.processedAt && sameDay(row.processedAt, new Date()));
  const todaysTotal = todaysPayouts.reduce((sum, row) => sum + (row.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin · Maliyyə</p>
          <h1 className="text-3xl font-semibold text-white">Escrow & Payouts</h1>
          <p className="text-sm text-slate-400">Held balansı izləyin və ödənişləri bir kliklə tamamlayın.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Held balans</p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatAZN(heldTotal)}</p>
            <p className="text-xs text-slate-500">{pendingEscrow.length} sifariş</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bugünkü ödəniş</p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatAZN(todaysTotal)}</p>
            <p className="text-xs text-slate-500">{todaysPayouts.length} tranzaksiya</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Son 25 payout</p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatAZN(payoutHistory.reduce((s, row) => s + (row.amount ?? 0), 0))}</p>
            <p className="text-xs text-slate-500">Log izlənir</p>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Held Escrow</h2>
            <span className="text-xs text-slate-500">Yalnız son 25 sifariş</span>
          </div>
          {pendingEscrow.length === 0 && (
            <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
              Held escrow yoxdur.
            </div>
          )}
          {pendingEscrow.map((order) => (
            <div key={order.orderId} className="rounded-3xl border border-slate-900 bg-slate-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">#{order.orderId.slice(0, 8)}</p>
                  <h3 className="text-lg font-semibold text-white">{order.listingModel}</h3>
                  <p className="text-sm text-slate-400">{order.buyerName || "Alici"} → {order.sellerName || "Satici"}</p>
                </div>
                <p className="text-xl font-semibold text-white">{formatAZN(order.amount ?? 0)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-slate-800 px-3 py-1">Status {order.escrowStatus}</span>
                <span className="rounded-full border border-slate-800 px-3 py-1">Tarix {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={releaseEscrow.bind(null, order.orderId, "Admin panel release")}
                  className="flex-1 min-w-[160px]">
                  <button type="submit" className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                    Satıcıya ödə
                  </button>
                </form>
                <form action={refundEscrow.bind(null, order.orderId, "Admin panel refund")}
                  className="flex-1 min-w-[160px]">
                  <button type="submit" className="w-full rounded-full border border-amber-400/60 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100">
                    Alıcıya qaytar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Payout tarixçəsi</h2>
            <span className="text-xs text-slate-500">Son 25 əməliyyat</span>
          </div>
          <div className="rounded-3xl border border-slate-900 bg-slate-900/40 divide-y divide-slate-900/60">
            {payoutHistory.map((payout) => (
              <div key={payout.id} className="grid gap-3 px-4 py-3 text-sm text-slate-300 md:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sifariş</p>
                  <p className="font-semibold text-white">#{payout.orderId.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Məbləğ</p>
                  <p>{formatAZN(payout.amount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tip</p>
                  <p>{payout.type === "seller_release" ? "Satıcı" : "Buyer refund"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tarix</p>
                  <p>{payout.processedAt ? new Date(payout.processedAt).toLocaleString() : "-"}</p>
                </div>
              </div>
            ))}
            {payoutHistory.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">Hələ payout yoxdur.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
