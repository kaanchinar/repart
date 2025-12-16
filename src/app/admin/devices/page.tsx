import { db } from "@/db";
import { deviceCatalogEntries, deviceCategories } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  upsertDeviceCatalogEntry,
  updateDeviceEntryStatus,
  toggleDeviceFeatured,
  deleteDeviceEntry,
  upsertDeviceCategory,
  toggleCategoryActive,
  deleteDeviceCategory,
} from "@/app/actions/admin-system";
import { requireAdminSession } from "@/lib/admin-session";
import { formatAZN } from "@/lib/validators";
import { BadgePlus, Star, Archive, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const DEVICE_TYPES = [
  { value: "phone", label: "Telefon" },
  { value: "computer", label: "Kompüter" },
  { value: "tablet", label: "Planşet" },
];

export default async function AdminDevicesPage() {
  await requireAdminSession();

  const [entries, categories] = await Promise.all([
    db.select().from(deviceCatalogEntries).orderBy(desc(deviceCatalogEntries.createdAt)),
    db.select().from(deviceCategories).orderBy(desc(deviceCategories.createdAt)),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin · Kataloq</p>
            <h1 className="text-3xl font-semibold text-white">Device kataloqu</h1>
            <p className="text-sm text-slate-400">Yeni modellər əlavə edin, statusu dəyişin və qiymət diapazonlarını idarə edin.</p>
          </header>

          <section className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <BadgePlus className="h-4 w-4 text-emerald-400" /> Yeni model
            </div>
            <form action={upsertDeviceCatalogEntry} className="grid gap-3 md:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 md:col-span-2">Cihaz növü</label>
              <select name="deviceType" className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white">
                {DEVICE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Brend</label>
                <input name="brand" placeholder="Apple" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Model</label>
                <input name="model" placeholder="iPhone 15" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Chipset</label>
                <input name="chipset" placeholder="A16" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Yaddaş</label>
                <input name="storage" placeholder="256GB" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">RAM</label>
                <input name="ram" placeholder="8GB" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Baz qiymət (AZN)</label>
                <input type="number" name="basePrice" placeholder="1200" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Minimum (AZN)</label>
                <input type="number" name="floorPrice" placeholder="950" className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Qeyd</label>
                <textarea name="notes" rows={3} placeholder="Əlavə qeydlər" className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 md:col-span-2">
                <input type="checkbox" name="isFeatured" className="rounded border-slate-700 bg-slate-900" />
                <span>Vitrinə çıxar</span>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white">Əlavə et</button>
              </div>
            </form>
          </section>

          <section className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-slate-900 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.deviceType}</p>
                    <h3 className="text-xl font-semibold text-white">{entry.brand} {entry.model}</h3>
                    <p className="text-sm text-slate-400">{entry.chipset || "Chipset qeyd olunmayıb"}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <form action={toggleDeviceFeatured.bind(null, entry.id, !entry.isFeatured)}>
                      <button type="submit" className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${entry.isFeatured ? "border-amber-500/40 bg-amber-500/10 text-amber-100" : "border-slate-800 text-slate-400"}`}>
                        <Star className="h-3.5 w-3.5" />
                        {entry.isFeatured ? "Featured" : "Feature"}
                      </button>
                    </form>
                    <form action={deleteDeviceEntry.bind(null, entry.id)}>
                      <button type="submit" className="rounded-full border border-slate-800 px-3 py-1 text-slate-400 hover:border-red-500/40 hover:text-red-200">
                        <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Sil
                      </button>
                    </form>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  {entry.storage && <span className="rounded-full border border-slate-800 px-3 py-1">{entry.storage}</span>}
                  {entry.ram && <span className="rounded-full border border-slate-800 px-3 py-1">RAM {entry.ram}</span>}
                  <span className="rounded-full border border-slate-800 px-3 py-1">Baz {formatAZN(entry.basePrice)}</span>
                  <span className="rounded-full border border-slate-800 px-3 py-1">Floor {formatAZN(entry.floorPrice)}</span>
                  <span className="rounded-full border border-slate-800 px-3 py-1">Status {entry.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {(["active", "draft", "archived"] as const).map((status) => (
                    <form key={status} action={updateDeviceEntryStatus.bind(null, entry.id, status)}>
                      <button
                        type="submit"
                        className={`rounded-full border px-3 py-1 ${
                          entry.status === status
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                            : "border-slate-800 text-slate-400"
                        }`}
                      >
                        {status}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}

            {entries.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center text-sm text-slate-500">
                Kataloq boşdur.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Archive className="h-4 w-4 text-cyan-400" /> Kateqoriya
            </div>
            <form action={upsertDeviceCategory} className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Ad</label>
                <input name="label" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Slug</label>
                <input name="slug" placeholder="phone-pro" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Növ</label>
                <select name="categoryDeviceType" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white">
                  {DEVICE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Təsvir</label>
                <textarea name="description" rows={3} className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" />
              </div>
              <button type="submit" className="w-full rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Kateqoriya əlavə et</button>
            </form>
          </section>

          <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Mövcud kateqoriyalar</h3>
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{category.label}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{category.slug}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <form action={toggleCategoryActive.bind(null, category.id, !category.isActive)}>
                      <button type="submit" className={`rounded-full border px-3 py-1 ${category.isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-slate-800 text-slate-400"}`}>
                        {category.isActive ? "Aktiv" : "Passiv"}
                      </button>
                    </form>
                    <form action={deleteDeviceCategory.bind(null, category.id)}>
                      <button type="submit" className="rounded-full border border-slate-800 px-3 py-1 text-slate-400 hover:border-red-500/40 hover:text-red-200">
                        Sil
                      </button>
                    </form>
                  </div>
                </div>
                {category.description && <p className="mt-2 text-xs text-slate-400">{category.description}</p>}
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-xs text-slate-500">Kateqoriya yoxdur.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
