"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

type EmailSignUpPayload = Parameters<typeof authClient.signUp.email>[0];

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [verificationPending, setVerificationPending] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [otpInfo, setOtpInfo] = useState("")
  const [otpSending, setOtpSending] = useState(false)
  const router = useRouter()

  const sendPhoneOtp = async () => {
    if (!phoneNumber.trim()) {
      setVerificationError("Telefon nömrəsini daxil edin")
      return false
    }
    setOtpSending(true)
    setVerificationError("")
    setOtpInfo("")
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber })
      if (error) {
        setVerificationError(error.message ?? "Xəta baş verdi")
        return false
      }
      setOtpInfo("Kod SMS ilə göndərildi")
      setVerificationCode("")
      return true
    } catch (error) {
      console.error(error)
      setVerificationError("Kod göndərmək alınmadı")
      return false
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode.trim()) {
      setVerificationError("SMS kodunu daxil edin")
      return
    }
    setVerificationLoading(true)
    setVerificationError("")
    try {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber,
        code: verificationCode.trim(),
        updatePhoneNumber: true
      })
      if (error) {
        setVerificationError(error.message ?? "Xəta baş verdi")
        setVerificationLoading(false)
        return
      }
      router.push("/")
    } catch (error) {
      console.error(error)
      setVerificationError("SMS təsdiqi alınmadı")
      setVerificationLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError("Zəhmət olmasa şərtləri qəbul edin")
      return
    }
    setLoading(true)
    setError("")

    const payload: EmailSignUpPayload = {
      email,
      password,
      name,
    };

    await authClient.signUp.email(payload, {
      onSuccess: async () => {
        setVerificationPending(true)
        setLoading(false)
        setError("")
        setVerificationError("")
        await sendPhoneOtp()
      },
      onError: (ctx) => {
        setError(ctx.error.message ?? "Xəta baş verdi")
        setLoading(false)
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Repart</p>
          <h2 className="text-2xl font-semibold text-white">
            {verificationPending ? "Telefon təsdiqi" : "Yeni hesab"}
          </h2>
          <p className="text-sm text-slate-400">
            {verificationPending ? "SMS kodunu daxil edin" : "Bir neçə field ilə qeydiyyat"}
          </p>
        </div>

        {verificationPending ? (
          <form className="space-y-5" onSubmit={handleVerifyPhone}>
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="verify-phone" className="text-xs text-slate-400">Telefon nömrəsi</label>
                <input
                  id="verify-phone"
                  name="verify-phone"
                  type="tel"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Telefon"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={otpSending}
                onClick={sendPhoneOtp}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 hover:border-slate-600 disabled:opacity-50"
              >
                {otpSending ? "Kod göndərilir..." : "SMS kodu göndər"}
              </button>
              <div className="space-y-2">
                <label htmlFor="sms-code" className="text-xs text-slate-400">SMS kodu</label>
                <input
                  id="sms-code"
                  name="sms-code"
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            </div>

            {verificationError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{verificationError}</div>
            )}
            {!verificationError && otpInfo && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">{otpInfo}</div>
            )}

            <button
              type="submit"
              disabled={verificationLoading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {verificationLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Təsdiqlə"}
            </button>
            <button
              type="button"
              disabled={otpSending}
              onClick={sendPhoneOtp}
              className="w-full rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-xs text-slate-400 hover:text-slate-100"
            >
              Kodu yenidən göndər
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleSignUp}>
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs text-slate-400">Ad Soyad</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Ad Soyad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-xs text-slate-400">Telefon</label>
                <input
                  id="phone"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="+994 ..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email-address" className="text-xs text-slate-400">Email</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs text-slate-400">Şifrə</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span><Link href="/terms" className="text-emerald-400 hover:text-emerald-300">İstifadəçi şərtləri</Link> ilə razıyam</span>
            </label>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Qeydiyyatdan keç"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          Artıq hesabınız var? <Link href="/sign-in" className="text-emerald-400 hover:text-emerald-300">Daxil olun</Link>
        </p>
      </div>
    </div>
  )
}
