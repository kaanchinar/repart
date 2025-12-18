import twilio, { Twilio } from "twilio"

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const defaultChannel = (process.env.TWILIO_DEFAULT_CHANNEL as "sms" | "whatsapp" | undefined) ?? "whatsapp"

const twilioSmsFrom = process.env.TWILIO_SMS_FROM
const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM

const twilioClient: Twilio | null = twilioAccountSid && twilioAuthToken
  ? twilio(twilioAccountSid, twilioAuthToken, { lazyLoading: true })
  : null

export type TwilioChannel = "sms" | "whatsapp"

export type SendOtpOptions = {
  to: string
  body: string
  channel?: TwilioChannel
}

function normalizeDestination(to: string, channel: TwilioChannel) {
  if (channel === "whatsapp" && !to.startsWith("whatsapp:")) {
    return `whatsapp:${to}`
  }
  return to
}

function resolveFrom(channel: TwilioChannel) {
  if (channel === "whatsapp") {
    return twilioWhatsAppFrom
  }
  return twilioSmsFrom
}

export async function sendOtpMessage({ to, body, channel }: SendOtpOptions) {
  if (!twilioClient) {
    console.warn("Twilio credentials are not configured.")
    return
  }

  const resolvedChannel: TwilioChannel = channel ?? defaultChannel
  const from = resolveFrom(resolvedChannel)
  if (!from) {
    console.warn(`Missing Twilio sender for channel: ${resolvedChannel}`)
    return
  }

  await twilioClient.messages.create({
    body,
    to: normalizeDestination(to, resolvedChannel),
    from,
  })
}
