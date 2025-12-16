import { db } from "@/db";
import { disputes, orders, listings, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { formatAZN } from "@/lib/validators";
import { requireAdminSession } from "@/lib/admin-session";
import { MessageSquareWarning } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  await requireAdminSession();

  const openDisputes = await db
    .select({
      id: disputes.id,
      reason: disputes.reason,
      status: disputes.status,
      createdAt: disputes.createdAt,
      orderId: orders.id,
      amount: orders.amount,
      buyerName: user.name,
      listingModel: listings.modelName,
    })
    .from(disputes)
    .innerJoin(orders, eq(disputes.orderId, orders.id))
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(user, eq(orders.buyerId, user.id))
    .where(eq(disputes.status, "open"))
    .orderBy(desc(disputes.createdAt));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">Disputes</h1>
              <p className="text-sm text-slate-400">Bütün açıq çəkişmələri izləyin və hallara prioritet verin.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
              <MessageSquareWarning className="h-4 w-4" /> {openDisputes.length} açıq
            </span>
          </div>
        </header>

        <div className="space-y-3">
          {openDisputes.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              Hal-hazırda açıq dispute yoxdur.
            </div>
          )}

          {openDisputes.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/admin/disputes/${dispute.id}`}
              className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-600"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Sifariş #{dispute.orderId.slice(0, 8)}</p>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                  {dispute.status}
                </span>
              </div>
              <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Alıcı</p>
                  <p>{dispute.buyerName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model</p>
                  <p>{dispute.listingModel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Məbləğ</p>
                  <p>{formatAZN(dispute.amount ?? 0)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">{dispute.reason || "Əlavə səbəb daxil edilməyib."}</p>
              <p className="text-xs text-slate-500">Açılma tarixi {new Date(dispute.createdAt).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
