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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {twoFactorRequired ? "İki Mərhələli Təsdiq" : "Giriş"}
          </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        {twoFactorRequired
                            ? usingBackupCode
                                ? "Backup kodunu daxil edin"
                                : usingSmsOtp
                                    ? "SMS ilə gələn kodu daxil edin"
                                    : "Authenticator tətbiqindəki kodu daxil edin"
                            : "Hesabınıza daxil olun"}
                    </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div className="space-y-4 rounded-md shadow-sm">
                        {twoFactorRequired ? (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="otp" className="sr-only">{usingBackupCode ? "Backup Kod" : "OTP Kodu"}</label>
                                        <input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            inputMode={usingBackupCode ? "text" : "numeric"}
                                            required
                                            className="relative block w-full rounded-md border-0 bg-gray-800 py-3 px-4 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                                            placeholder={usingBackupCode ? "XXXX-XXXX" : usingSmsOtp ? "SMS kodu" : "000000"}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-green-500 focus:ring-green-500"
                                                checked={trustDevice}
                                                onChange={(e) => setTrustDevice(e.target.checked)}
                                            />
                                            Bu cihazı yadda saxla
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUsingBackupCode((prev) => !prev)
                                                setUsingSmsOtp(false)
                                                setOtp("")
                                                setError("")
                                            }}
                                            className="text-green-400 hover:text-green-300"
                                        >
                                            {usingBackupCode ? "Authenticator kodundan istifadə et" : "Backup kodu ilə daxil ol"}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
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
                                                    } catch (error) {
                                                        console.error(error)
                                                        setError("Kod göndərmək alınmadı")
                                                    } finally {
                                                        setSendingOtp(false)
                                                    }
                                            }}
                                            className="w-full rounded-md border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-900 disabled:opacity-50"
                                        >
                                            {sendingOtp ? "Kod göndərilir..." : (usingSmsOtp ? "SMS kodunu yenidən göndər" : "SMS ilə kod göndər")}
                                        </button>
                                        {usingSmsOtp && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUsingSmsOtp(false)
                                                    setOtp("")
                                                    setInfo("")
                                                }}
                                                className="w-full rounded-md border border-transparent bg-transparent px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200"
                                            >
                                                Authenticator koduna qayıt
                                            </button>
                                        )}
                                    </div>
                                </div>
                        ) : (
                <>
                    <div>
                    <label htmlFor="identifier" className="sr-only">Email və ya Telefon</label>
                    <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        required
                        className="relative block w-full rounded-md border-0 bg-gray-800 py-3 px-4 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                        placeholder="Email və ya Telefon"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
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
                        className="relative block w-full rounded-md border-0 bg-gray-800 py-3 px-4 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                        placeholder="Şifrə"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>
                </>
            )}
          </div>

          {!twoFactorRequired && (
            <div className="flex items-center justify-between">
                <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-green-500 hover:text-green-400">
                    Şifrəni unutmusunuz?
                </Link>
                </div>
            </div>
          )}

                    {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
                    {!error && info && (
                        <div className="text-green-500 text-sm text-center">{info}</div>
                    )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (twoFactorRequired ? "Təsdiqlə" : "Daxil ol")}
            </button>
          </div>
        </form>

        {!twoFactorRequired && (
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-900 px-2 text-gray-400">və ya</span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true)
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
                            } catch (error) {
                                console.error(error)
                                setError("Passkey xətası")
                                setLoading(false)
                            }
                        }}
                        className="flex w-full items-center justify-center gap-3 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.875 14.25l1.214 1.942a2.25 2.25 0 001.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9h4.636a2.25 2.25 0 011.872 1.002l.164.246a2.25 2.25 0 001.872 1.002h2.092a2.25 2.25 0 001.872-1.002l.164-.246A2.25 2.25 0 0116.954 9h4.636M2.41 9a2.25 2.25 0 00-.16.832V12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 12V9.832c0-.287-.055-.57-.16-.832M2.41 9a2.25 2.25 0 01.382-.632l3.285-3.832a2.25 2.25 0 011.708-.786h8.43c.657 0 1.281.287 1.709.786l3.284 3.832c.163.19.291.404.382.632M7 20.25h10" />
                        </svg>
                        Passkey (Biometrik) ilə daxil ol
                    </button>
                </div>
            </div>
        )}

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Hesabınız yoxdur?{" "}
            <Link href="/sign-up" className="font-medium text-green-500 hover:text-green-400">
              Qeydiyyatdan keçin
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
