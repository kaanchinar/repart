import Link from "next/link";
import { db } from "@/db";
import { listings, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatAZN } from "@/lib/validators";
import { submitListingModeration, moderateListing } from "@/app/actions/admin-moderation";
import { BadgeAlert, Flashlight, FilterX } from "lucide-react";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const DEVICE_FILTERS = [
  { value: "all", label: "Hamısı" },
  { value: "phone", label: "Telefon" },
  { value: "computer", label: "Kompüter" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Status" },
  { value: "active", label: "Aktiv" },
  { value: "draft", label: "Dayandırılıb" },
  { value: "sold", label: "Satılıb" },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string; status?: string; focus?: string }>;
}) {
  const { device = "all", status = "all", focus } = await searchParams;
  await requireAdminSession();

  const rawListings = await db
    .select({
      listing: listings,
      seller: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(listings)
    .leftJoin(user, eq(listings.sellerId, user.id))
    .orderBy(desc(listings.createdAt))
    .limit(40);

  const filtered = rawListings.filter(({ listing }) => {
    const matchesDevice = device === "all" || listing.deviceType === device;
    const matchesStatus = status === "all" || listing.status === status;
    return matchesDevice && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold text-white">Elan Moderasiyası</h1>
          <p className="text-sm text-slate-400">Şübhəli elanları dayandırın, risk dərəcəsi təyin edin və qeydlər aparın.</p>
        </header>

        <div className="flex flex-wrap gap-3 text-xs">
          {DEVICE_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/admin/listings?device=${filter.value}&status=${status}`}
              className={`rounded-full border px-4 py-2 transition ${
                filter.value === device
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                  : "border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              {filter.label}
            </Link>
          ))}
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/admin/listings?device=${device}&status=${filter.value}`}
              className={`rounded-full border px-4 py-2 transition ${
                filter.value === status
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-100"
                  : "border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              {filter.label}
            </Link>
          ))}
          <Link
            href="/admin/listings"
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-slate-400 hover:border-slate-600"
          >
            <FilterX className="h-3.5 w-3.5" /> Təmizlə
          </Link>
        </div>

        <div className="space-y-4">
          {filtered.map(({ listing, seller }) => {
            const highlight = focus === listing.id || (listing.riskScore ?? 50) >= 70;
            return (
              <div
                key={listing.id}
                className={`rounded-2xl border bg-slate-900/40 p-4 transition ${
                  highlight ? "border-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.15)]" : "border-slate-800"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{listing.deviceType}</p>
                    <h2 className="text-xl font-semibold text-white">{listing.modelName}</h2>
                    <p className="text-sm text-slate-400">
                      {seller?.name || "Naməlum"} · {seller?.email || "—"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="rounded-full border border-slate-700 px-3 py-1">{listing.status}</span>
                      <span className="rounded-full border border-slate-700 px-3 py-1">{formatAZN(listing.price)}</span>
                      <span className="rounded-full border border-slate-700 px-3 py-1">Risk {listing.riskScore ?? 50}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 text-xs text-slate-400">
                    <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
                      {listing.conditionSummary || "Vəziyyət məlumatı daxil edilməyib."}
                    </p>
                    {listing.moderationNotes && (
                      <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
                        <BadgeAlert className="mr-2 inline h-4 w-4" /> {listing.moderationNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
                  <form action={submitListingModeration.bind(null, listing.id)} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                    <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Qeyd</label>
                    <textarea
                      name="moderationNotes"
                      defaultValue={listing.moderationNotes ?? ""}
                      placeholder="Şübhəli hissələri qeyd edin"
                      className="min-h-[90px] w-full rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-white focus:border-emerald-500/60 focus:outline-none"
                    />
                    <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Risk xalı</label>
                    <input
                      type="range"
                      name="riskScore"
                      min={0}
                      max={100}
                      defaultValue={listing.riskScore ?? 50}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        name="status"
                        defaultValue={listing.status}
                        className="flex-1 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white"
                      >
                        <option value="active">Aktiv</option>
                        <option value="draft">Dayandırılıb</option>
                        <option value="sold">Satılıb</option>
                      </select>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Flashlight className="h-4 w-4" /> Yadda saxla
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Sürətli hərəkət</p>
                    <div className="flex flex-col gap-2">
                      <form action={moderateListing.bind(null, listing.id, { status: "draft", riskScore: Math.max(70, listing.riskScore ?? 70) })}>
                        <button
                          type="submit"
                          className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                        >
                          Şübhəli hesabla
                        </button>
                      </form>
                      <form action={moderateListing.bind(null, listing.id, { status: "active", riskScore: Math.min(40, listing.riskScore ?? 40) })}>
                        <button
                          type="submit"
                          className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                        >
                          Aktiv et
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              Uyğun elan tapılmadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
