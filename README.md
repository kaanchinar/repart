This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

### Twilio OTP delivery

The Better-Auth 2FA and phone login flows send OTPs through Twilio. Configure the following variables in your `.env` file:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # sandbox sender; keep whatsapp: prefix
TWILIO_SMS_FROM=+1xxxxxxxxxx                # optional, required for SMS channel
TWILIO_DEFAULT_CHANNEL=whatsapp             # or sms
```

`TWILIO_DEFAULT_CHANNEL` lets you pick whether OTPs default to WhatsApp or SMS. When using WhatsApp, pass bare phone numbers (e.g. `+994...`); the app automatically applies the `whatsapp:` prefix.

## Admin Panel Access

The `/admin` routes are protected by `requireAdminSession()`.

1. Assign yourself an elevated role by updating `user.role` to `admin` (or `moderator`) in the database, **or** add your email to `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated list, lowercase) and redeploy.
2. Sign in normally. After Better-Auth issues a session, visit `/admin`—the guard looks at both the persisted role and the env override list.
3. To remove access, revert the role to `user` or delete the email from the env variable and recycle the server.

## WhatsApp OTP Notifications

`src/lib/notification-service.ts` wraps Twilio's WhatsApp API. All Better-Auth OTP flows (`twoFactor`, `phoneNumber`) now call `notificationService.sendOtp`, which:

- Normalizes the destination to WhatsApp by default (still supports SMS fallback).
- Generates short, localized copy for login, phone verification, and 2FA intents.
- Keeps Twilio credentials and routing inside `src/lib/twilio.ts` so other notifications (e.g., admin broadcasts) can reuse the same transport.

## Data Model (Mermaid ERD)

```mermaid
erDiagram
    user {
        string id PK
        string name
        string email
        boolean email_verified
        string image
        string created_at
        string updated_at
        boolean two_factor_enabled
        string phone_number
        boolean phone_number_verified
        string role
        boolean is_banned
        int trust_score
    }

    addresses {
        string id PK
        string user_id FK
        string title
        string address_line
        string city
        string zip_code
        boolean is_default
        string created_at
    }

    listings {
        string id PK
        string seller_id FK
        string model_name
        string brand
        string device_type
        string imei_masked
        string imei_encrypted
        string fault_tree
        string photos
        string condition_summary
        int price
        string moderation_notes
        int risk_score
        string status
        string created_at
    }

    device_catalog_entries {
        string id PK
        string device_type
        string brand
        string model
        string chipset
        string storage
        string ram
        int base_price
        int floor_price
        string status
        boolean is_featured
        string notes
        string created_at
        string updated_at
    }

    device_categories {
        string id PK
        string label
        string slug
        string description
        string device_type
        boolean is_active
        string created_at
        string updated_at
    }

    orders {
        string id PK
        string listing_id FK
        string buyer_id FK
        string seller_id FK
        int amount
        string escrow_status
        string cargo_tracking_code
        string delivered_at
        string created_at
    }

    payouts {
        string id PK
        string order_id FK
        int amount
        string type
        string status
        string processed_by FK
        string note
        string created_at
        string processed_at
    }

    disputes {
        string id PK
        string order_id FK
        string reason
        string video_proof_url
        string status
        string created_at
    }

    messages {
        string id PK
        string sender_id FK
        string receiver_id FK
        string listing_id FK
        string content
        boolean is_read
        string created_at
    }

    cart_items {
        string id PK
        string user_id FK
        string listing_id FK
        string created_at
    }

    system_notifications {
        string id PK
        string title
        string message
        string channel
        string audience
        string status
        int sent_count
        string created_by FK
        string metadata
        string created_at
        string last_sent_at
    }

    system_notification_recipients {
        string id PK
        string notification_id FK
        string user_id FK
        string delivery_status
        string delivered_at
    }

    admin_audit_logs {
        string id PK
        string actor_id FK
        string action
        string entity_type
        string entity_id
        string metadata
        string created_at
    }

    session {
        string id PK
        string expires_at
        string token
        string created_at
        string updated_at
        string ip_address
        string user_agent
        string user_id FK
    }

    account {
        string id PK
        string account_id
        string provider_id
        string user_id FK
        string access_token
        string refresh_token
        string id_token
        string access_token_expires_at
        string refresh_token_expires_at
        string scope
        string password
        string created_at
        string updated_at
    }

    verification {
        string id PK
        string identifier
        string value
        string expires_at
        string created_at
        string updated_at
    }

    two_factor {
        string id PK
        string secret
        string backup_codes
        string user_id FK
    }

    passkey {
        string id PK
        string name
        string public_key
        string user_id FK
        string credential_id
        int counter
        string device_type
        boolean backed_up
        string transports
        string created_at
        string aaguid
    }

    user ||--o{ addresses : has
    user ||--o{ listings : sells
    user ||--o{ orders : buysOrSells
    user ||--o{ payouts : processes
    user ||--o{ messages : sends
    user ||--o{ cart_items : owns
    user ||--o{ system_notifications : creates
    user ||--o{ system_notification_recipients : receives
    user ||--o{ admin_audit_logs : audits
    user ||--o{ session : maintains
    user ||--o{ account : links
    user ||--o{ two_factor : secures
    user ||--o{ passkey : registers

    listings ||--o{ orders : sourceFor
    listings ||--o{ messages : referencedBy
    listings ||--o{ cart_items : addedTo

    orders ||--o{ payouts : generates
    orders ||--o{ disputes : mayHave

    system_notifications ||--o{ system_notification_recipients : targets
```
