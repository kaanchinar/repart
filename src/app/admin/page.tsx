import Link from "next/link";
import { db } from "@/db";
import { listings, user, orders, disputes, deviceCatalogEntries, systemNotifications } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Activity, ShieldAlert, Users, ClipboardList, AlertTriangle, ArrowRight, Database, BellRing } from "lucide-react";
import { formatAZN } from "@/lib/validators";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function formatCount(value?: number) {
  return value?.toLocaleString("az-Latn-AZ") ?? "0";
}

export default async function AdminOverviewPage() {
  await requireAdminSession();

  const [
    activeListingsCountResult,
    pendingDisputesResult,
    totalUsersResult,
    heldOrdersResult,
    recentListings,
    catalogCountResult,
    draftNotificationsResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(eq(listings.status, "active"))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(disputes)
      .where(eq(disputes.status, "open"))
      .limit(1),
    db.select({ count: sql<number>`count(*)` }).from(user).limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.escrowStatus, "held"))
      .limit(1),
    db
      .select()
      .from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(8),
    db
      .select({ count: sql<number>`count(*)` })
      .from(deviceCatalogEntries)
      .where(eq(deviceCatalogEntries.status, "active"))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(systemNotifications)
      .where(eq(systemNotifications.status, "draft"))
      .limit(1),
  ]);

  const activeListingsCount = activeListingsCountResult[0]?.count ?? 0;
  const pendingDisputesCount = pendingDisputesResult[0]?.count ?? 0;
  const totalUsersCount = totalUsersResult[0]?.count ?? 0;
  const heldOrdersCount = heldOrdersResult[0]?.count ?? 0;
  const catalogCount = catalogCountResult[0]?.count ?? 0;
  const draftNotifications = draftNotificationsResult[0]?.count ?? 0;

  const riskAlerts = recentListings.filter((listing) => (listing.riskScore ?? 50) >= 70).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin Paneli</p>
            <h1 className="text-3xl font-semibold text-white">Nəzarət Mərkəzi</h1>
            <p className="text-sm text-slate-400">Satış axınını izləyin, istifadəçiləri idarə edin və riskli elanları izləyin.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <Link href="/admin/listings" className="rounded-full border border-slate-800 px-4 py-2 hover:border-slate-600">Elan nəzarəti</Link>
            <Link href="/admin/users" className="rounded-full border border-slate-800 px-4 py-2 hover:border-slate-600">İstifadəçilər</Link>
            <Link href="/admin/devices" className="rounded-full border border-slate-800 px-4 py-2 hover:border-slate-600">Device kataloqu</Link>
            <Link href="/admin/financials" className="rounded-full border border-slate-800 px-4 py-2 hover:border-slate-600">Maliyyə</Link>
            <Link href="/admin/notifications" className="rounded-full border border-slate-800 px-4 py-2 hover:border-slate-600">Bildirişlər</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Aktiv Elan</p>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(activeListingsCount)}</p>
            <p className="text-xs text-slate-500">Hazırda satışda</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Disputlar</p>
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(pendingDisputesCount)}</p>
            <p className="text-xs text-slate-500">Həll gözləyən mübahisə</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">İstifadəçilər</p>
              <Users className="h-4 w-4 text-sky-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(totalUsersCount)}</p>
            <p className="text-xs text-slate-500">Qeydiyyatdan keçən</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Eskro</p>
              <ClipboardList className="h-4 w-4 text-fuchsia-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(heldOrdersCount)}</p>
            <p className="text-xs text-slate-500">Məbləğ gözləyir</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kataloq</p>
              <Database className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(catalogCount)}</p>
            <p className="text-xs text-slate-500">Aktiv model</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Bildiriş Draft</p>
              <BellRing className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(draftNotifications)}</p>
            <p className="text-xs text-slate-500">Göndərilməyi gözləyir</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Monitorinq</p>
                <h2 className="text-lg font-semibold text-white">Son Elanlar</h2>
              </div>
              <Link href="/admin/listings" className="text-xs text-slate-400 hover:text-white">
                Hamısına bax
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {recentListings.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{item.modelName}</p>
                    <p className="text-xs text-slate-500">{item.conditionSummary || "Vəziyyət qeyd olunmayıb"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      (item.riskScore ?? 50) >= 70
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      Risk {item.riskScore ?? 50}
                    </span>
                    <span className="text-slate-300">{formatAZN(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="border-b border-slate-800 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alertlər</p>
              <h2 className="text-lg font-semibold text-white">Risk Monitoru</h2>
            </div>
            <div className="space-y-4 p-4">
              {riskAlerts.length === 0 && (
                <p className="text-sm text-slate-500">Riskli elan yoxdur.</p>
              )}
              {riskAlerts.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">{alert.modelName}</p>
                  </div>
                  <p className="mt-2 text-xs text-amber-100/80">
                    {(alert.moderationNotes && alert.moderationNotes.length > 0)
                      ? alert.moderationNotes
                      : (alert.conditionSummary || "Əlavə qeydlər yoxdur")}
                  </p>
                  <Link
                    href={`/admin/listings?focus=${alert.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-wide text-amber-200"
                  >
                    Nəzarət et <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
