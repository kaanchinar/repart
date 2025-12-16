"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

type EmailSignUpPayload = Parameters<typeof authClient.signUp.email>[0] & {
  phoneNumber?: string;
};

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
      phoneNumber,
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {verificationPending ? "Telefon təsdiqi" : "Qeydiyyat"}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {verificationPending ? "Nömrənizi SMS kodu ilə təsdiqləyin" : "Yeni hesab yaradın"}
          </p>
        </div>

        {verificationPending ? (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyPhone}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="verify-phone" className="text-xs text-gray-400">Telefon nömrəsi</label>
                <input
                  id="verify-phone"
                  name="verify-phone"
                  type="tel"
                  className="mt-1 relative block w-full rounded-md border border-gray-700 bg-gray-900 py-3 px-4 text-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none sm:text-sm"
                  placeholder="Telefon nömrəsi"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={otpSending}
                onClick={sendPhoneOtp}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-900/70 disabled:opacity-50"
              >
                {otpSending ? "Kod göndərilir..." : "SMS kodunu göndər"}
              </button>
              <div>
                <label htmlFor="sms-code" className="text-xs text-gray-400">SMS kodu</label>
                <input
                  id="sms-code"
                  name="sms-code"
                  type="text"
                  inputMode="numeric"
                  className="mt-1 relative block w-full rounded-md border border-gray-700 bg-gray-900 py-3 px-4 text-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none sm:text-sm"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            </div>

            {verificationError && (
              <div className="text-red-500 text-sm text-center">{verificationError}</div>
            )}
            {!verificationError && otpInfo && (
              <div className="text-green-500 text-sm text-center">{otpInfo}</div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={verificationLoading}
                className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Təsdiqlə"}
              </button>
              <button
                type="button"
                disabled={otpSending}
                onClick={sendPhoneOtp}
                className="w-full rounded-md border border-transparent bg-transparent px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200"
              >
                Kodu yenidən göndər
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="name" className="sr-only">Ad Soyad</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="relative block w-full rounded-md border-0 bg-gray-800 py-3 px-4 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                  placeholder="Ad Soyad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">Telefon</label>
                <input
                  id="phone"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Telefon nömrəsi"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">Email</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full rounded-md border-0 bg-gray-800 py-3 px-4 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                  placeholder="Email ünvanı"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Şifrə</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Şifrə"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded bg-gray-900"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                <Link href="/terms" className="text-green-500 hover:text-green-400">İstifadəçi şərtləri</Link> ilə razıyam
              </label>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Qeydiyyatdan keç"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Artıq hesabınız var?{" "}
            <Link href="/sign-in" className="font-medium text-green-500 hover:text-green-400">
              Daxil olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
