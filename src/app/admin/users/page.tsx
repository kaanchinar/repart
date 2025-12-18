import { Fragment } from "react";
import { db } from "@/db";
import { user, adminAuditLogs } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-session";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { setUserBan, updateUserRole, adjustTrustScore } from "@/app/actions/admin-moderation";
import { ShieldBan, CheckCheck, UserPlus2 } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS = [
  { value: "user" as const, label: "İstifadəçi" },
  { value: "moderator" as const, label: "Moderator" },
  { value: "admin" as const, label: "Admin" },
];

const ACTION_LABELS: Record<string, string> = {
  "user.ban": "Hesab bloklandı",
  "user.unban": "Ban ləğv edildi",
  "user.role": "Rol dəyişdi",
  "user.trust": "Güvən skor yeniləndi",
};

function describeLog(action: string, metadata: unknown) {
  const base = ACTION_LABELS[action] ?? action;
  if (!metadata || typeof metadata !== "object") {
    return base;
  }
  const meta = metadata as Record<string, unknown>;
  if (action === "user.role" && typeof meta.role === "string") {
    return `${base} → ${meta.role}`;
  }
  if (action === "user.trust") {
    const next = typeof meta.nextScore === "number" ? meta.nextScore : undefined;
    const delta = typeof meta.delta === "number" ? meta.delta : undefined;
    const deltaLabel = typeof delta === "number" ? `${delta > 0 ? "+" : ""}${delta}` : undefined;
    if (next !== undefined || deltaLabel) {
      return `${base}${next !== undefined ? ` · ${next}` : ""}${deltaLabel ? ` (${deltaLabel})` : ""}`;
    }
  }
  return base;
}

export default async function AdminUsersPage() {
  await requireAdminSession();
  const actor = alias(user, "actor");
  const [users, auditLogs] = await Promise.all([
    db.select().from(user).orderBy(desc(user.createdAt)).limit(50),
    db
      .select({
        id: adminAuditLogs.id,
        entityId: adminAuditLogs.entityId,
        action: adminAuditLogs.action,
        metadata: adminAuditLogs.metadata,
        createdAt: adminAuditLogs.createdAt,
        actorName: actor.name,
        actorEmail: actor.email,
      })
      .from(adminAuditLogs)
      .leftJoin(actor, eq(actor.id, adminAuditLogs.actorId))
      .where(eq(adminAuditLogs.entityType, "user"))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(200),
  ]);

  type AuditEntry = (typeof auditLogs)[number];
  const logsByUser = auditLogs.reduce<Record<string, AuditEntry[]>>((acc, log) => {
    if (!log.entityId) return acc;
    if (!acc[log.entityId]) acc[log.entityId] = [];
    acc[log.entityId].push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold text-white">İstifadəçi İdarəetməsi</h1>
          <p className="text-sm text-slate-400">Qeydiyyat tarixçəsini görün, riskləri izləyin və rolları dəyişin.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.4em] text-slate-500">
                <th className="px-4 py-4 font-medium">İstifadəçi</th>
                <th className="px-4 py-4 font-medium">Telefon</th>
                <th className="px-4 py-4 font-medium">Rol</th>
                <th className="px-4 py-4 font-medium">Risk</th>
                <th className="px-4 py-4 font-medium text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((item) => {
                const activity = logsByUser[item.id] ?? [];
                return (
                <Fragment key={item.id}>
                <tr className="text-slate-200">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.email}</div>
                    <div className="text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleDateString("az-Latn-AZ")}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-300">{item.phoneNumber || "—"}</div>
                    <div className={`text-[11px] ${item.phoneNumberVerified ? "text-emerald-400" : "text-amber-400"}`}>
                      {item.phoneNumberVerified ? "Təsdiqlənib" : "Təsdiqlənməyib"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {ROLE_OPTIONS.map((roleOption) => (
                        <form
                          key={roleOption.value}
                          action={updateUserRole.bind(null, item.id, roleOption.value)}
                        >
                          <button
                            type="submit"
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              roleOption.value === item.role
                                ? "border-emerald-400/60 text-emerald-200"
                                : "border-slate-700 text-slate-400 hover:border-slate-500"
                            }`}
                            disabled={roleOption.value === item.role}
                          >
                            {roleOption.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-white">{item.trustScore ?? 80}</div>
                      <div className="flex gap-2 text-xs">
                        {[-10, -5, 5, 10].map((delta) => (
                          <form key={delta} action={adjustTrustScore.bind(null, item.id, delta)}>
                            <button
                              type="submit"
                              className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-500"
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">Risk səviyyəsi {item.isBanned ? "bloklanıb" : item.trustScore >= 70 ? "normal" : "yoxlama tələb edir"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={setUserBan.bind(null, item.id, !item.isBanned)}>
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                            item.isBanned
                              ? "border-emerald-500/60 text-emerald-300"
                              : "border-rose-500/60 text-rose-200"
                          }`}
                        >
                          {item.isBanned ? (
                            <>
                              <CheckCheck className="h-3.5 w-3.5" /> Banı aç
                            </>
                          ) : (
                            <>
                              <ShieldBan className="h-3.5 w-3.5" /> Ban et
                            </>
                          )}
                        </button>
                      </form>
                      {!item.twoFactorEnabled && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-3 py-1 text-[11px] text-amber-200">
                          <UserPlus2 className="h-3.5 w-3.5" /> 2FA yoxdur
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 pb-6 pt-0">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-500">
                        <span>Fəaliyyət qeydləri</span>
                        <span>{activity.length ? `${activity.length} qeyd` : "—"}</span>
                      </div>
                      {activity.length > 0 ? (
                        <ul className="space-y-2 text-xs text-slate-400">
                          {activity.slice(0, 4).map((log) => (
                            <li key={log.id} className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/40 p-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <span className="font-semibold text-white">{log.actorName || "Sistem"}</span>
                                <span className="text-slate-400"> · {describeLog(log.action, log.metadata)}</span>
                              </div>
                              <span className="text-[11px] text-slate-500">{new Date(log.createdAt).toLocaleString("az-Latn-AZ")}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-500">Heç bir fəaliyyət qeydi yoxdur.</p>
                      )}
                    </div>
                  </td>
                </tr>
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
