import { sendOtpMessage, TwilioChannel } from "@/lib/twilio"

export type OtpIntent = "login" | "two-factor" | "phone-verification"
export type OtpLocale = "az" | "en"

const intentCopy: Record<OtpIntent, { az: string; en: string }> = {
  login: {
    az: "Daxil olmaq üçün kod",
    en: "Login code",
  },
  "two-factor": {
    az: "2FA təsdiqi",
    en: "2FA approval",
  },
  "phone-verification": {
    az: "Telefon təsdiqi",
    en: "Phone verification",
  },
}

export type SendOtpParams = {
  phoneNumber: string
  code: string
  intent?: OtpIntent
  channel?: TwilioChannel
  locale?: OtpLocale
}

class NotificationService {
  async sendOtp({ phoneNumber, code, intent = "login", channel = "whatsapp", locale = "az" }: SendOtpParams) {
    const body = this.composeOtpBody({ code, intent, locale })
    await sendOtpMessage({ to: phoneNumber, body, channel })
  }

  private composeOtpBody({ code, intent, locale }: { code: string; intent: OtpIntent; locale: OtpLocale }) {
    const prefix = intentCopy[intent]?.[locale] ?? intentCopy.login[locale]
    if (locale === "en") {
      return `${prefix}: ${code}`
    }
    return `${prefix}: ${code}`
  }
}

export const notificationService = new NotificationService()
