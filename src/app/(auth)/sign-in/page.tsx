"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [twoFactorRequired, setTwoFactorRequired] = useState(false)
    const [otp, setOtp] = useState("")
    const [usingBackupCode, setUsingBackupCode] = useState(false)
    const [usingSmsOtp, setUsingSmsOtp] = useState(false)
    const [trustDevice, setTrustDevice] = useState(true)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [info, setInfo] = useState("")
    const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setInfo("")

    if (twoFactorRequired) {
        try {
            if (usingBackupCode) {
                const { error: backupError } = await authClient.twoFactor.verifyBackupCode({
                    code: otp,
                    trustDevice
                })
                if (backupError) {
                    setError(backupError.message ?? "Xəta baş verdi")
                    setLoading(false)
                    return
                }
            } else if (usingSmsOtp) {
                const { error: otpError } = await authClient.twoFactor.verifyOtp({
                    code: otp,
                    trustDevice
                })
                if (otpError) {
                    setError(otpError.message ?? "Xəta baş verdi")
                    setLoading(false)
                    return
                }
            } else {
                const { error: totpError } = await authClient.twoFactor.verifyTotp({
                    code: otp,
                    trustDevice
                })
                if (totpError) {
                    setError(totpError.message ?? "Xəta baş verdi")
                    setLoading(false)
                    return
                }
            }
            setLoading(false)
            router.push("/")
                        } catch (error) {
                            console.error(error)
                            setError("Kod göndərmək alınmadı")
            setLoading(false)
        }
        return
    }

    const isPhone = /^\+?[0-9]{10,15}$/.test(identifier)

    try {
        if (isPhone) {
            await authClient.signIn.phoneNumber({
                phoneNumber: identifier,
                password,
            }, {
                onSuccess: (ctx) => {
                    if (ctx.data.twoFactorRedirect) {
                        setTwoFactorRequired(true)
                        setOtp("")
                        setUsingBackupCode(false)
                        setUsingSmsOtp(false)
                        setTrustDevice(true)
                        setInfo("")
                        setLoading(false)
                    } else {
                        router.push("/")
                    }
                },
                onError: (ctx) => {
                    setError(ctx.error.message ?? "Xəta baş verdi")
                    setLoading(false)
                }
            })
        } else {
            await authClient.signIn.email({
                email: identifier,
                password,
            }, {
                onSuccess: (ctx) => {
                    if (ctx.data.twoFactorRedirect) {
                        setTwoFactorRequired(true)
                        setOtp("")
                        setUsingBackupCode(false)
                        setUsingSmsOtp(false)
                        setTrustDevice(true)
                        setInfo("")
                        setLoading(false)
                    } else {
                        router.push("/")
                    }
                },
                onError: (ctx) => {
                    setError(ctx.error.message ?? "Xəta baş verdi")
                    setLoading(false)
                }
            })
        }
    } catch (error) {
        console.error(error)
        setError("Xəta baş verdi")
        setLoading(false)
    }
  }

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
            <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
                <div className="space-y-2 text-center">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Repart</p>
                    <h1 className="text-2xl font-semibold text-white">
                        {twoFactorRequired ? "Təsdiq kodu" : "Hesaba giriş"}
                    </h1>
                    <p className="text-sm text-slate-400">
                        {twoFactorRequired
                            ? usingBackupCode
                                ? "Backup kodunu yazın"
                                : usingSmsOtp
                                    ? "SMS ilə gələn kodu yazın"
                                    : "Authenticator kodunu yazın"
                            : "Email/telefon və şifrə ilə daxil olun"}
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSignIn}>
                    <div className="space-y-4">
                        {twoFactorRequired ? (
                            <div className="space-y-4">
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUsingBackupCode(false)
                                            setUsingSmsOtp(false)
                                            setOtp("")
                                            setError("")
                                            setInfo("")
                                        }}
                                        className={`flex-1 rounded-lg border px-3 py-2 ${
                                            !usingBackupCode && !usingSmsOtp
                                                ? "border-emerald-400/60 bg-emerald-400/10 text-white"
                                                : "border-slate-800 text-slate-400"
                                        }`}
                                    >
                                        Authenticator
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setUsingBackupCode(false)
                                            setUsingSmsOtp(true)
                                            setOtp("")
                                            setError("")
                                            setInfo("SMS kodu istəyin")
                                        }}
                                        className={`flex-1 rounded-lg border px-3 py-2 ${
                                            usingSmsOtp
                                                ? "border-sky-400/60 bg-sky-400/10 text-white"
                                                : "border-slate-800 text-slate-400"
                                        }`}
                                    >
                                        SMS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUsingBackupCode(true)
                                            setUsingSmsOtp(false)
                                            setOtp("")
                                            setError("")
                                            setInfo("Backup kodu daxil edin")
                                        }}
                                        className={`flex-1 rounded-lg border px-3 py-2 ${
                                            usingBackupCode
                                                ? "border-amber-400/60 bg-amber-400/10 text-white"
                                                : "border-slate-800 text-slate-400"
                                        }`}
                                    >
                                        Backup
                                    </button>
                                </div>
                                <div>
                                    <label htmlFor="otp" className="sr-only">OTP</label>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        inputMode={usingBackupCode ? "text" : "numeric"}
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                                        placeholder={usingBackupCode ? "XXXX-XXXX" : usingSmsOtp ? "SMS kodu" : "000000"}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                        checked={trustDevice}
                                        onChange={(e) => setTrustDevice(e.target.checked)}
                                    />
                                    Bu cihazı yadda saxla
                                </label>
                                <button
                                    type="button"
                                    disabled={sendingOtp}
                                    onClick={async () => {
                                        setSendingOtp(true)
                                        setError("")
                                        try {
                                            const { error: sendError } = await authClient.twoFactor.sendOtp()
                                            if (sendError) {
                                                setError(sendError.message ?? "Xəta baş verdi")
                                            } else {
                                                setInfo("Kod SMS ilə göndərildi")
                                                setUsingSmsOtp(true)
                                                setUsingBackupCode(false)
                                            }
                                        } catch (err) {
                                            console.error(err)
                                            setError("Kod göndərmək alınmadı")
                                        } finally {
                                            setSendingOtp(false)
                                        }
                                    }}
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 hover:border-slate-600 disabled:opacity-50"
                                >
                                    {sendingOtp ? "Kod göndərilir..." : usingSmsOtp ? "SMS kodunu yenilə" : "SMS ilə kod göndər"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="identifier" className="text-xs text-slate-400">Email və ya telefon</label>
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                                        placeholder="example@mail.com və ya +994..."
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
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
                                <div className="text-right text-sm">
                                    <Link href="/forgot-password" className="text-emerald-400 hover:text-emerald-300">
                                        Şifrəni unutmusunuz?
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
                    )}
                    {!error && info && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">{info}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : twoFactorRequired ? "Təsdiqlə" : "Daxil ol"}
                    </button>
                </form>

                {!twoFactorRequired && (
                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true)
                            setError("")
                            try {
                                await authClient.signIn.passkey({
                                    fetchOptions: {
                                        onSuccess: () => {
                                            router.push("/")
                                        },
                                        onError: (ctx) => {
                                            setError(ctx.error.message ?? "Xəta baş verdi")
                                            setLoading(false)
                                        }
                                    }
                                })
                            } catch (err) {
                                console.error(err)
                                setError("Passkey xətası")
                                setLoading(false)
                            }
                        }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-slate-600"
                    >
                        Passkey ilə daxil ol
                    </button>
                )}

                <p className="text-center text-sm text-slate-400">
                    Hesabınız yoxdur? <Link href="/sign-up" className="text-emerald-400 hover:text-emerald-300">Qeydiyyatdan keçin</Link>
                </p>
            </div>
        </div>
    )
}
