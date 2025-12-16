import Link from "next/link";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { formatAZN } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";
import { Filter, MonitorSmartphone, Search, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; device?: string; brand?: string; price?: string; condition?: string }>;

type ListingRecord = typeof listings.$inferSelect;

type ListingMeta = {
  brand: string;
  deviceType: string;
  conditionLabel: string;
  conditionCategory: "ready" | "needs-care" | "for-parts";
  highlights: string[];
};

const PRICE_BUCKETS = [
  { id: "any", label: "Bütün qiymətlər", min: 0, max: Infinity },
  { id: "0-500", label: "0 – 500 AZN", min: 0, max: 500 },
  { id: "500-800", label: "500 – 800 AZN", min: 500, max: 800 },
  { id: "800-1200", label: "800 – 1,200 AZN", min: 800, max: 1200 },
  { id: "1200+", label: "1,200+ AZN", min: 1200, max: Infinity },
];

function guessBrand(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("iphone")) return "Apple";
  if (normalized.includes("samsung")) return "Samsung";
  if (normalized.includes("pixel")) return "Google";
  if (normalized.includes("xiaomi")) return "Xiaomi";
  if (normalized.includes("macbook")) return "Apple";
  if (normalized.includes("asus")) return "ASUS";
  if (normalized.includes("acer")) return "Acer";
  if (normalized.includes("lenovo")) return "Lenovo";
  return "Digər";
}

function deriveMeta(listing: ListingRecord): ListingMeta {
  const faultTree = (listing.faultTree as Record<string, unknown>) || {};
  const answers = (faultTree.answers as Record<string, string>) || faultTree;
  const deviceType = (faultTree.deviceType as string) || listing.deviceType || "phone";
  const brand = (faultTree.brand as string) || listing.brand || guessBrand(listing.modelName);

  const highlights: string[] = [];
  if (answers.screen === "working" || answers.display === "clean") highlights.push("Ekran sağlam");
  if (answers.board === "working" || answers.logicBoard === "stable") highlights.push("Ana plata OK");
  if (answers.battery === "good" || answers.batteryHealth === "ok") highlights.push("Batareya normal");
  if (answers.keyboard === "working") highlights.push("Klaviatura işlək");
  if (answers.ports === "clean") highlights.push("Portlar təmiz");

  const severeIssues = ["not_working", "dead", "faulty", "broken", "bad"];
  const severityScore = Object.values(answers).reduce((score, value) => {
    if (typeof value !== "string") return score;
    if (severeIssues.some((issue) => value.includes(issue))) {
      return score + 2;
    }
    if (value.includes("minor") || value.includes("worn")) {
      return score + 1;
    }
    return score;
  }, 0);

  let conditionCategory: ListingMeta["conditionCategory"] = "ready";
  if (severityScore >= 3) {
    conditionCategory = "for-parts";
  } else if (severityScore >= 1) {
    conditionCategory = "needs-care";
  }

  const conditionLabel =
    conditionCategory === "ready"
      ? "İstifadəyə hazır"
      : conditionCategory === "needs-care"
      ? "Yüngül təmir lazımdır"
      : "Detallıq üçün";

  return {
    brand,
    deviceType,
    conditionCategory,
    conditionLabel,
    highlights: highlights.length ? highlights : ["Ətraflı vəziyyət üçün elan açın"],
  };
}

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", device = "all", brand = "all", price = "any", condition = "all" } = await searchParams;

  const baseListings = await db
    .select()
    .from(listings)
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt))
    .limit(120);

  const listingsWithMeta = baseListings.map((listing) => ({
    data: listing,
    meta: deriveMeta(listing),
  }));

  const selectedPrice = PRICE_BUCKETS.find((bucket) => bucket.id === price) ?? PRICE_BUCKETS[0];

  const filtered = listingsWithMeta.filter(({ data, meta }) => {
    const matchesQuery = q ? data.modelName.toLowerCase().includes(q.toLowerCase()) || meta.brand.toLowerCase().includes(q.toLowerCase()) : true;
    const matchesDevice = device === "all" ? true : meta.deviceType === device;
    const matchesBrand = brand === "all" ? true : meta.brand.toLowerCase() === brand.toLowerCase();
    const matchesPrice = data.price >= selectedPrice.min && data.price <= selectedPrice.max;
    const matchesCondition = condition === "all" ? true : meta.conditionCategory === condition;
    return matchesQuery && matchesDevice && matchesBrand && matchesPrice && matchesCondition;
  });

  const brandOptions = Array.from(new Set(listingsWithMeta.map(({ meta }) => meta.brand))).sort();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="space-y-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Kataloq</p>
              <h1 className="text-3xl font-semibold text-white">İkincil bazarda hazır cihazlar</h1>
              <p className="text-sm text-slate-400">Telefon və noutbukları filtr edin, təmir dəyərini əvvəlcədən görün.</p>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-5 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-4 w-4" /> Öz cihazını sat
            </Link>
          </div>

          <form className="relative mt-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Model, marka və ya xüsusiyyət axtar"
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none"
            />
            <input type="hidden" name="device" value={device} />
            <input type="hidden" name="brand" value={brand} />
            <input type="hidden" name="price" value={price} />
            <input type="hidden" name="condition" value={condition} />
          </form>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Cihaz növü</p>
              <div className="mt-3 space-y-2 text-sm">
                {[{ id: "all", label: "Hamısı" }, { id: "phone", label: "Telefon" }, { id: "computer", label: "Kompüter" }].map((item) => (
                  <Link
                    key={item.id}
                    href={`/listings?device=${item.id}&brand=${brand}&price=${price}&condition=${condition}&q=${encodeURIComponent(q)}`}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                      device === item.id
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                        : "border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span>{item.label}</span>
                    <MonitorSmartphone className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Marka</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/listings?device=${device}&brand=all&price=${price}&condition=${condition}&q=${encodeURIComponent(q)}`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    brand === "all"
                      ? "border-sky-500/50 bg-sky-500/10 text-sky-100"
                      : "border-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  Hamısı
                </Link>
                {brandOptions.slice(0, 10).map((brandOption) => (
                  <Link
                    key={brandOption}
                    href={`/listings?device=${device}&brand=${encodeURIComponent(brandOption)}&price=${price}&condition=${condition}&q=${encodeURIComponent(q)}`}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      brand.toLowerCase() === brandOption.toLowerCase()
                        ? "border-sky-500/50 bg-sky-500/10 text-sky-100"
                        : "border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {brandOption}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Qiymət</p>
              <div className="mt-3 space-y-2">
                {PRICE_BUCKETS.map((bucket) => (
                  <Link
                    key={bucket.id}
                    href={`/listings?device=${device}&brand=${brand}&price=${bucket.id}&condition=${condition}&q=${encodeURIComponent(q)}`}
                    className={`block rounded-xl border px-3 py-2 text-sm ${
                      price === bucket.id
                        ? "border-purple-500/40 bg-purple-500/10 text-purple-100"
                        : "border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {bucket.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Vəziyyət</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {[{ id: "all", label: "Hamısı" }, { id: "ready", label: "Yaxşı" }, { id: "needs-care", label: "Servislik" }, { id: "for-parts", label: "Detallıq" }].map((option) => (
                  <Link
                    key={option.id}
                    href={`/listings?device=${device}&brand=${brand}&price=${price}&condition=${option.id}&q=${encodeURIComponent(q)}`}
                    className={`rounded-full border px-3 py-1 ${
                      condition === option.id
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-100"
                        : "border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <p>
                {filtered.length} elan tapıldı
                {q && (
                  <span className="text-slate-500"> — &quot;{q}&quot;</span>
                )}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500">
                <Filter className="h-3 w-3" /> FİLTR
              </div>
            </div>

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm text-slate-400">
                Yuxarıdakı filtrləri dəyişərək uyğun elan tapın.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(({ data, meta }) => (
                <Link key={data.id} href={`/listings/${data.id}`} className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-600">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    {data.photos?.length ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={data.photos[0]} alt={data.modelName} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-600">Foto yoxdur</div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{meta.brand}</span>
                      <span>{meta.conditionLabel}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{data.modelName}</h3>
                    <p className="text-sm text-slate-400">{meta.highlights.slice(0, 2).join(" · ")}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-semibold text-emerald-400">{formatAZN(data.price)}</span>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-400">{meta.deviceType === "computer" ? "Notebook" : "Telefon"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
