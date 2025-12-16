"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : "/reset-password"
        const res = await fetch("/api/auth/request-password-reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, redirectTo })
        })

        if (!res.ok) {
            const data = await res.json().catch(() => null)
            throw new Error(data?.message || "Şifrə yeniləmə alınmadı")
        }

        setSuccess(true)
        setLoading(false)
    } catch (err) {
        console.error("Failed to send password reset", err)
        setError(err instanceof Error ? err.message : "Xəta baş verdi")
        setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Şifrəni yenilə</h2>
          <p className="mt-2 text-sm text-gray-400">
            Email ünvanınızı daxil edin
          </p>
        </div>

        {success ? (
            <div className="bg-green-900/50 border border-green-900 text-green-200 p-4 rounded-lg text-center">
                Şifrə yeniləmə linki email ünvanınıza göndərildi.
            </div>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleReset}>
            <div className="space-y-4 rounded-md shadow-sm">
                <div>
                <label htmlFor="email-address" className="sr-only">Email</label>
                <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                    placeholder="Email ünvanı"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
                <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Göndər"}
                </button>
            </div>
            </form>
        )}
        
        <div className="text-center">
            <Link href="/sign-in" className="text-sm text-green-500 hover:text-green-400">
                Giriş səhifəsinə qayıt
            </Link>
        </div>
      </div>
    </div>
  )
}
