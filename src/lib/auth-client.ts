import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "@better-auth/passkey/client"
import { twoFactorClient, phoneNumberClient } from "better-auth/client/plugins"

const clientBaseURL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")

export const authClient = createAuthClient({
    plugins: [ 
        passkeyClient(),
        twoFactorClient(),
        phoneNumberClient()
    ],
    baseURL: clientBaseURL || undefined
})
