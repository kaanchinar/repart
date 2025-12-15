"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Loader2, Save, LogOut } from "lucide-react"
import { luhnCheck } from "@/lib/validators"
import { toast } from "sonner"

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
      // @ts-ignore - we added these fields to schema but client types might need update
      setPhone(session.user.phone || "")
      // @ts-ignore
      setCardPan(session.user.payoutCardPan || "")
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
      toast.error("Yadda saxlamaq mümkün olmadı")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  if (isPending) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  if (!session) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-white">Profil</h1>
      
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 space-y-4">
        <div>
          <label className="text-sm text-gray-400">Ad Soyad</label>
          <div className="text-white font-medium">{session.user.name}</div>
        </div>
        <div>
          <label className="text-sm text-gray-400">Email</label>
          <div className="text-white font-medium">{session.user.email}</div>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold text-white">Əlaqə və Ödəniş</h2>
        
        <div>
          <label className="text-sm text-gray-400">Telefon</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="+994 50 000 00 00"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Kart Nömrəsi (16 rəqəm)</label>
          <input
            type="text"
            value={cardPan}
            onChange={(e) => setCardPan(e.target.value.replace(/\D/g, '').slice(0, 16))}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="0000 0000 0000 0000"
          />
          <p className="text-xs text-gray-500 mt-1">Yalnız Azərbaycan kartları (Card-to-Card üçün)</p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 text-white p-2 rounded flex items-center justify-center gap-2 font-medium"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Yadda saxla
        </button>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-900/50 p-2 rounded flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Çıxış
      </button>
    </div>
  )
}
