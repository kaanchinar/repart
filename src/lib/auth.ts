import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { twoFactor, phoneNumber } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { notificationService } from "@/lib/notification-service";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const rpHost = (() => {
    try {
        return new URL(appUrl).hostname;
    } catch {
        return "localhost";
    }
})();

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
    }),
    appName: "Repart",
    emailAndPassword: {  
        enabled: true
    },
    plugins: [
        twoFactor({
            issuer: "Repart",
            otpOptions: {
                async sendOTP({ user, otp }) {
                    const userWithPhone = user as typeof user & { phoneNumber?: string };
                    const phoneNumber = userWithPhone.phoneNumber;

                    if (!phoneNumber) {
                        console.warn("Two-factor OTP requested but no phone number on file.");
                        return;
                    }

                    try {
                        await notificationService.sendOtp({
                            phoneNumber,
                            code: otp,
                            intent: "two-factor",
                        });
                    } catch (error) {
                        console.error("Failed to send two-factor OTP via Twilio", error);
                    }
                },
            }
        }),
        passkey({
            rpID: rpHost,
            rpName: "Repart",
            origin: appUrl
        }),
        phoneNumber({
            requireVerification: true,
            sendOTP: async ({ phoneNumber, code }) => {
                try {
                    await notificationService.sendOtp({
                        phoneNumber,
                        code,
                        intent: "phone-verification",
                    });
                } catch (error) {
                    console.error("Failed to send phone login OTP via Twilio", error);
                }
            },
        })
    ],
});

