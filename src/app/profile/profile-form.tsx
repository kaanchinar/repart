"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Loader2, Save, LogOut } from "lucide-react"
import { luhnCheck } from "@/lib/validators"
import { toast } from "sonner"

type ExtendedUserFields = {
  phoneNumber?: string | null;
  phone?: string | null;
  payoutCardPan?: string | null;
};

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession()
  const [phone, setPhone] = useState("")
  const [cardPan, setCardPan] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Fetch user extra details (phone, card) - BetterAuth session might not have them by default if not configured to return custom fields
  // For simplicity, we assume we might need to fetch them or they are in session.user if we extended the schema correctly.
  // However, BetterAuth client session usually only has basic info. We might need a separate API call or use `authClient.useSession` with custom fields if configured.
  // Let's assume we need to fetch or they are there.
  // Actually, let's create an API route to get/update profile to be sure.

  useEffect(() => {
    if (session?.user) {
      const userWithExtras = session.user as typeof session.user & ExtendedUserFields;
      setPhone(userWithExtras.phoneNumber || userWithExtras.phone || "")
      setCardPan(userWithExtras.payoutCardPan || "")
    }
  }, [session])

  const handleSave = async () => {
    if (cardPan && !luhnCheck(cardPan)) {
      toast.error("Kart nömrəsi yanlışdır (Luhn xətası)")
      return
    }

    setLoading(true)
    try {
      // We need a custom API route for updating these specific fields as BetterAuth updateProfile might not cover custom fields out of the box easily without plugins
      // Or we can use authClient.updateUser if we configured it.
      // Let's try using a custom API route for safety and control.
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, payoutCardPan: cardPan }),
      })

      if (!res.ok) throw new Error("Xəta baş verdi")
      
      toast.success("Profil yeniləndi")
      router.refresh()
    } catch (error) {
      console.error("Failed to update profile", error)
      toast.error("Yadda saxlamaq mümkün olmadı")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-800 bg-[#0b0f18] p-6">
        <Loader2 className="h-5 w-5 animate-spin text-slate-200" />
      </div>
    )
  }

  if (!session) {
    router.push("/sign-in")
    return null
  }

  const maskedCard = cardPan ? cardPan.replace(/(\d{4})(?=\d)/g, "$1 ").trim() : ""

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f18] p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profil məlumatları</p>
          <h2 className="text-2xl font-semibold text-white">Şəxsi məlumat</h2>
          <p className="text-sm text-slate-400">Hesabınızın əsas əlaqə detalları və payout kartı</p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
        >
          <LogOut className="h-4 w-4" />
          Çıxış
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#11172a] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ad Soyad</p>
          <p className="mt-2 text-lg font-semibold text-white">{session.user.name}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#11172a] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Email</p>
          <p className="mt-2 text-lg font-semibold text-white">{session.user.email}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#11172a] p-4 text-sm text-slate-400">
          Telefon nömrəsi
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-medium text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            placeholder="+994 50 000 00 00"
          />
        </label>
        <label className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#11172a] p-4 text-sm text-slate-400">
          Kart nömrəsi
          <input
            type="text"
            value={maskedCard}
            onChange={(e) => setCardPan(e.target.value.replace(/\D/g, "").slice(0, 16))}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-medium text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            placeholder="0000 0000 0000 0000"
          />
          <span className="text-xs text-slate-500">Yalnız AZN kartları · Luhn yoxlanışı tətbiq olunur</span>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Yadda saxla
        </button>
        <div className="rounded-2xl border border-slate-800 bg-[#11172a] px-4 py-3 text-xs text-slate-400">
          Kart məlumatları şifrələnmiş şəkildə saxlanılır və yalnız payout üçün istifadə olunur.
        </div>
      </div>
    </section>
  )
}
