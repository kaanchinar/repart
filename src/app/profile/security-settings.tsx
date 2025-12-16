"use client"

import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import { authClient } from "@/lib/auth-client"
import {
  Copy,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

type PasskeyRecord = {
  id: string
  name?: string | null
  createdAt?: string | Date
  deviceType?: string
}

const formatDisplayDate = (value?: string | Date) => {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  })
}

export default function SecuritySettings() {
  const sessionQuery = authClient.useSession()
  const passkeyQuery = authClient.useListPasskeys()

  const [passkeyName, setPasskeyName] = useState("")
  const [passkeyActionId, setPasskeyActionId] = useState<string | null>(null)
  const [addingPasskey, setAddingPasskey] = useState(false)

  const [twoFactorPassword, setTwoFactorPassword] = useState("")
  const [twoFactorOtp, setTwoFactorOtp] = useState("")
  const [twoFactorTrustDevice, setTwoFactorTrustDevice] = useState(true)
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ totpURI: string; backupCodes: string[] } | null>(null)
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null)
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([])
  const [backupPassword, setBackupPassword] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [twoFactorLoading, setTwoFactorLoading] = useState({ enable: false, verify: false, disable: false, backup: false })

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "", revoke: false })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const isTwoFactorEnabled = Boolean(sessionQuery.data?.user?.twoFactorEnabled)
  const passkeys: PasskeyRecord[] = passkeyQuery.data ?? []

  useEffect(() => {
    if (!twoFactorSetup?.totpURI) {
      setTwoFactorQr(null)
      return
    }
    QRCode.toDataURL(twoFactorSetup.totpURI, { margin: 1, scale: 6 })
      .then(setTwoFactorQr)
      .catch(() => setTwoFactorQr(null))
  }, [twoFactorSetup?.totpURI])

  const handleAddPasskey = async () => {
    if (!passkeyName.trim()) {
      toast.error("Cihaz üçün ad daxil edin")
      return
    }
    setAddingPasskey(true)
    try {
      const { error } = await authClient.passkey.addPasskey({ name: passkeyName.trim() })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Passkey əlavə edildi")
      setPasskeyName("")
      await passkeyQuery.refetch()
    } catch (error) {
      console.error(error)
      toast.error("Passkey əlavə etmək alınmadı")
    } finally {
      setAddingPasskey(false)
    }
  }

  const handleDeletePasskey = async (id: string) => {
    setPasskeyActionId(id)
    try {
      const { error } = await authClient.$fetch("/passkey/delete-passkey", {
        method: "POST",
        body: { id }
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Passkey silindi")
      await passkeyQuery.refetch()
    } catch (error) {
      console.error(error)
      toast.error("Passkey silmək alınmadı")
    } finally {
      setPasskeyActionId(null)
    }
  }

  const handleBeginTwoFactor = async () => {
    if (!twoFactorPassword) {
      toast.error("Əvvəlcə cari şifrənizi daxil edin")
      return
    }
    setTwoFactorLoading((prev) => ({ ...prev, enable: true }))
    setGeneratedBackupCodes([])
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: twoFactorPassword,
        issuer: "Repart"
      })
      if (error || !data) {
        toast.error(error?.message ?? "2FA aktivləşdirmək alınmadı")
        return
      }
      setTwoFactorSetup(data)
      setGeneratedBackupCodes(data.backupCodes)
      toast.success("Authenticator üçün QR hazırdır")
    } catch (error) {
      console.error(error)
      toast.error("2FA aktivləşdirmək alınmadı")
    } finally {
      setTwoFactorLoading((prev) => ({ ...prev, enable: false }))
    }
  }

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorSetup) return
    if (!twoFactorOtp.trim()) {
      toast.error("Authenticator kodunu daxil edin")
      return
    }
    setTwoFactorLoading((prev) => ({ ...prev, verify: true }))
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: twoFactorOtp.trim(),
        trustDevice: twoFactorTrustDevice
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("İki mərhələli təsdiq aktiv edildi")
      setTwoFactorSetup(null)
      setTwoFactorOtp("")
      setTwoFactorPassword("")
      setGeneratedBackupCodes([])
      await sessionQuery.refetch()
    } catch (error) {
      console.error(error)
      toast.error("Kodu təsdiqləmək alınmadı")
    } finally {
      setTwoFactorLoading((prev) => ({ ...prev, verify: false }))
    }
  }

  const handleDisableTwoFactor = async () => {
    if (!disablePassword) {
      toast.error("Şifrə daxil edin")
      return
    }
    setTwoFactorLoading((prev) => ({ ...prev, disable: true }))
    try {
      const { error } = await authClient.twoFactor.disable({ password: disablePassword })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("2FA deaktiv edildi")
      setDisablePassword("")
      await sessionQuery.refetch()
    } catch (error) {
      console.error(error)
      toast.error("2FA deaktiv etmək alınmadı")
    } finally {
      setTwoFactorLoading((prev) => ({ ...prev, disable: false }))
    }
  }

  const handleGenerateBackupCodes = async () => {
    if (!backupPassword) {
      toast.error("Şifrə daxil edin")
      return
    }
    setTwoFactorLoading((prev) => ({ ...prev, backup: true }))
    try {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password: backupPassword })
      if (error || !data) {
        toast.error(error?.message ?? "Backup kodları yeniləmək alınmadı")
        return
      }
      setGeneratedBackupCodes(data.backupCodes)
      setBackupPassword("")
      toast.success("Yeni backup kodlar yaradıldı")
    } catch (error) {
      console.error(error)
      toast.error("Backup kodları yeniləmək alınmadı")
    } finally {
      setTwoFactorLoading((prev) => ({ ...prev, backup: false }))
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.next) {
      toast.error("Şifrələri doldurun")
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("Şifrələr uyğun gəlmir")
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
        revokeOtherSessions: passwordForm.revoke
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Şifrə yeniləndi")
      setPasswordForm({ current: "", next: "", confirm: "", revoke: passwordForm.revoke })
    } catch (error) {
      console.error(error)
      toast.error("Şifrəni dəyişmək alınmadı")
    } finally {
      setPasswordLoading(false)
    }
  }

  const secretFromURI = useMemo(() => {
    if (!twoFactorSetup?.totpURI) return ""
    const secretMatch = twoFactorSetup.totpURI.split("secret=")[1]
    return secretMatch ? secretMatch.split("&")[0] : ""
  }, [twoFactorSetup?.totpURI])

  const copyBackupCodes = async () => {
    if (!generatedBackupCodes.length) return
    try {
      await navigator.clipboard.writeText(generatedBackupCodes.join("\n"))
      toast.success("Kodlar kopyalandı")
    } catch (error) {
      console.error(error)
      toast.error("Kopyalamaq alınmadı")
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f18] p-6 text-sm shadow-lg sm:p-8 lg:space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">Security control</p>
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <Shield className="h-5 w-5 text-slate-200" />
          Təhlükəsizlik paneli
        </h2>
        <p className="text-slate-400">Passkey, iki mərhələli təsdiq və şifrə dəyişimi bir ekranda.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-[#11172a] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-800 p-3">
                <Fingerprint className="h-5 w-5 text-slate-200" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Biometrik giriş (Passkey)</p>
                <p className="text-xs text-slate-400">Face ID / Touch ID ilə saniyələr içində giriş.</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input
                type="text"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="Cihaz adı"
                className="w-full rounded-2xl border border-slate-700 bg-[#0b0f18] px-3 py-2 text-white placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPasskey}
                disabled={addingPasskey}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-50"
              >
                {addingPasskey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Əlavə et"}
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {passkeyQuery.isPending ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Passkey siyahısı yüklənir...
              </div>
            ) : passkeys.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-slate-500">Hələ heç bir passkey əlavə edilməyib.</p>
            ) : (
              passkeys.map((passkey) => (
                <div key={passkey.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0f1424] px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{passkey.name || "Adsız cihaz"}</p>
                    <p className="text-xs text-slate-500">
                      {passkey.deviceType?.toUpperCase()} · {formatDisplayDate(passkey.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePasskey(passkey.id)}
                    disabled={passkeyActionId === passkey.id}
                    className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-slate-500 hover:text-white disabled:opacity-50"
                  >
                    {passkeyActionId === passkey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#11172a] p-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3">
                <Smartphone className="h-5 w-5 text-slate-200" />
              </div>
              <div>
                <p className="text-base font-semibold">İki mərhələli təsdiq (2FA)</p>
                <p className="text-xs text-slate-300">Authenticator + backup kodlarla əlavə qorunma.</p>
              </div>
            </div>
            <span className={`rounded-full border px-4 py-1 text-xs font-semibold tracking-wide ${isTwoFactorEnabled ? "border-emerald-600 text-emerald-100" : "border-slate-600 text-slate-300"}`}>
              {isTwoFactorEnabled ? "Aktivdir" : "Passivdir"}
            </span>
          </div>

          {!isTwoFactorEnabled && (
            <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-[#0b0f18] p-4">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Cari şifrə
                <input
                  type="password"
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-4 py-2 text-white placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={handleBeginTwoFactor}
                disabled={twoFactorLoading.enable}
                className="w-full rounded-2xl border border-slate-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {twoFactorLoading.enable ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Authenticator üçün QR yarat"}
              </button>

              {twoFactorSetup && (
                <div className="space-y-5 border-t border-slate-800 pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-[#0b0f18] p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">QR kodu</p>
                      <div className="mt-3 flex items-center justify-center">
                        {twoFactorQr ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={twoFactorQr} alt="2FA QR" className="h-40 w-40 rounded-lg border border-slate-700" />
                        ) : (
                          <span className="text-[11px] text-slate-500">QR yaratmaq alınmadı</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Manual secret</p>
                      <code className="block rounded-2xl border border-dashed border-slate-700 bg-[#05070d] px-3 py-2 text-xs text-slate-100">{secretFromURI}</code>
                      <label className="text-xs text-slate-300">
                        Authenticator kodu
                        <input
                          type="text"
                          value={twoFactorOtp}
                          onChange={(e) => setTwoFactorOtp(e.target.value)}
                          placeholder="000000"
                          className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-600 bg-[#05070d] text-slate-100 focus:ring-slate-500"
                          checked={twoFactorTrustDevice}
                          onChange={(e) => setTwoFactorTrustDevice(e.target.checked)}
                        />
                        Bu cihazı güvənilən kimi yadda saxla
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleVerifyTwoFactor}
                          disabled={twoFactorLoading.verify}
                          className="flex-1 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                        >
                          {twoFactorLoading.verify ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Təsdiqlə"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTwoFactorSetup(null)
                            setGeneratedBackupCodes([])
                            setTwoFactorOtp("")
                          }}
                          className="rounded-2xl border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:text-white"
                        >
                          Ləğv et
                        </button>
                      </div>
                    </div>
                  </div>

                  {generatedBackupCodes.length > 0 && (
                    <div className="space-y-3 rounded-2xl border border-dashed border-slate-700 bg-[#05070d] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">Backup kodlar</p>
                        <button type="button" onClick={copyBackupCodes} className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white">
                          <Copy className="h-3 w-3" /> Kopyala
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-100">
                        {generatedBackupCodes.map((code) => (
                          <span key={code} className="rounded-xl border border-slate-800 bg-[#0b0f18] px-2 py-1 text-center">
                            {code}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">Kodları təhlükəsiz yerdə saxlayın — yenidən göstərilməyəcək.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isTwoFactorEnabled && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-[#0b0f18] p-4">
                <p className="text-sm font-semibold text-white">2FA-nı deaktiv et</p>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-3 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleDisableTwoFactor}
                  disabled={twoFactorLoading.disable}
                  className="mt-3 w-full rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {twoFactorLoading.disable ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Deaktiv et"}
                </button>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0b0f18] p-4">
                <p className="text-sm font-semibold text-white">Yeni backup kodlar</p>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-3 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateBackupCodes}
                  disabled={twoFactorLoading.backup}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                >
                  {twoFactorLoading.backup ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Yenilə
                </button>
                {generatedBackupCodes.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-slate-200">
                    {generatedBackupCodes.map((code) => (
                      <span key={code} className="rounded-xl border border-slate-800 bg-[#0b0f18] px-2 py-1 text-center">
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-[#11172a] p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-3">
            <KeyRound className="h-5 w-5 text-slate-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Şifrəni dəyiş</p>
            <p className="text-xs text-slate-400">Güclü şifrə hesabınızı qoruyur.</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 text-xs text-slate-400">
            Hazırkı şifrə
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-4 py-2 text-white focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="text-xs text-slate-400">
            Yeni şifrə
            <input
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-4 py-2 text-white focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="text-xs text-slate-400">
            Şifrəni təkrar et
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#05070d] px-4 py-2 text-white focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="md:col-span-2 inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-[#05070d] p-3 text-xs text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-[#05070d] text-slate-100 focus:ring-slate-500"
              checked={passwordForm.revoke}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, revoke: e.target.checked }))}
            />
            Digər cihazlardakı sessiyaları bağla
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Şifrəni yenilə
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
