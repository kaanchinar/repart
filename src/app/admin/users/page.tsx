import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-session";
import { desc } from "drizzle-orm";
import { setUserBan, updateUserRole, adjustTrustScore } from "@/app/actions/admin-moderation";
import { ShieldBan, CheckCheck, UserPlus2 } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS = [
  { value: "user" as const, label: "İstifadəçi" },
  { value: "moderator" as const, label: "Moderator" },
  { value: "admin" as const, label: "Admin" },
];

export default async function AdminUsersPage() {
  await requireAdminSession();

  const users = await db.select().from(user).orderBy(desc(user.createdAt)).limit(50);

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
              {users.map((item) => (
                <tr key={item.id} className="text-slate-200">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
