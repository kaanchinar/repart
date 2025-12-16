import { db } from "@/db";
import { systemNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin-session";
import { handleNotificationForm } from "@/app/actions/admin-system";
import { BellRing } from "lucide-react";

export const dynamic = "force-dynamic";

const CHANNELS = [
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
  { value: "both", label: "Hər ikisi" },
];

const AUDIENCE = [
  { value: "all", label: "Hamısı" },
  { value: "buyers", label: "Alıcılar" },
  { value: "sellers", label: "Satıcılar" },
];

export default async function AdminNotificationsPage() {
  await requireAdminSession();

  const notifications = await db
    .select()
    .from(systemNotifications)
    .orderBy(desc(systemNotifications.createdAt))
    .limit(30);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <header>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin · Bildiriş</p>
            <h1 className="text-3xl font-semibold text-white">Broadcast mərkəzi</h1>
            <p className="text-sm text-slate-400">Push və SMS elanlarını idarə edin, auditoriyaya çatdırın.</p>
          </header>

          <form action={handleNotificationForm} className="rounded-3xl border border-slate-900 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BellRing className="h-4 w-4 text-amber-400" /> Yeni bildiriş
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Başlıq</label>
              <input name="title" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" placeholder="Bazarda yeni model var" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Məzmun</label>
              <textarea name="message" rows={4} className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white" placeholder="Sürətli təsvir" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Kanal</label>
                <select name="channel" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white">
                  {CHANNELS.map((channel) => (
                    <option key={channel.value} value={channel.value}>
                      {channel.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Auditoriya</label>
                <select name="audience" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white">
                  {AUDIENCE.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <button name="intent" value="draft" className="flex-1 rounded-full border border-slate-800 px-4 py-2 text-white">
                Draft saxla
              </button>
              <button name="intent" value="send" className="flex-1 rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white">
                Göndər
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Tarixçə</h2>
            <span className="text-xs text-slate-500">Son 30</span>
          </div>
          <div className="rounded-3xl border border-slate-900 bg-slate-900/40 divide-y divide-slate-900/60">
            {notifications.map((notification) => (
              <div key={notification.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{notification.channel} · {notification.audience}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${
                    notification.status === "draft"
                      ? "border-slate-700 text-slate-300"
                      : notification.status === "failed"
                        ? "border-red-500/40 text-red-200"
                        : "border-emerald-500/40 text-emerald-100"
                  }`}>
                    {notification.status}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{notification.message}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{notification.sentCount} istifadəçi</span>
                  {notification.lastSentAt && <span>Son göndəriş {new Date(notification.lastSentAt).toLocaleString()}</span>}
                </div>
                {notification.status !== "sent" && (
                  <form action={handleNotificationForm} className="flex gap-2 text-xs">
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <input type="hidden" name="title" value={notification.title} />
                    <input type="hidden" name="message" value={notification.message} />
                    <input type="hidden" name="channel" value={notification.channel} />
                    <input type="hidden" name="audience" value={notification.audience} />
                    <button name="intent" value="draft" className="rounded-full border border-slate-700 px-3 py-1 text-white">Yadda saxla</button>
                    <button name="intent" value="send" className="rounded-full border border-emerald-500/50 px-3 py-1 text-emerald-100">İndi göndər</button>
                  </form>
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Hələ bildiriş yoxdur.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
