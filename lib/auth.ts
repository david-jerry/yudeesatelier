import { config } from "@/config";
import db from "@/db";
import * as schemas from "@/db/models";
import { betterAuth } from "better-auth/minimal"; 
import { drizzleAdapter } from "@better-auth/drizzle-adapter"; 
import { passkey } from "@better-auth/passkey"
import { multiSession } from "better-auth/plugins/multi-session";
import { nextCookies } from "better-auth/next-js";
import { inngest } from "@/inngest/client";
import { VerifyEmailHTML } from "@/components/emails/verifyEmail";
import { ResetPasswordEmailHTML } from "@/components/emails/resetPassword";
import { CryptoService } from "./encryption";

export const auth = betterAuth({
    secret: config.ENC_KEY_1!,
    baseUrl: config.BASE_URL!,
    appName: config.TITLE,
    trustedOrigins: config.TRUSTED_ORIGINS ? config.TRUSTED_ORIGINS : [config.BASE_URL],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    plugins: [
        passkey(),
        multiSession(),
        nextCookies(),
    ],
    user: {
        additionalFields: {
            imagePublicId: {
                type: "string",
                required: false,
            },
            subscribed: {
                type: "boolean",
                defaultValue: false
            },
            isAdmin: {
                type: "boolean",
                defaultValue: false
            },
            isStaff: {
                type: "boolean",
                defaultValue: false
            },
            isBanned: {
                type: "boolean",
                defaultValue: false
            },
        }
    },
    emailVerification: {
        autoSignInAfterVerification: true,
        sendOnSignUp: true,
        sendOnSignIn: true,
        async sendVerificationEmail(data) {
            const user = data.user
            const token = data.token
            const emailHtml = await VerifyEmailHTML({
                username: user.name,
                verifyLink: `${config.BASE_URL}/auth/verify-email?token=${token}`
            })
            // ! Important: add queue email sending here for nodemailer
            console.info(`[Auth] Sending verification email to ${user.email}`);
            await inngest.send({
                name: "marketing/email",
                data: {
                    html: emailHtml,
                    to: user.email,
                    subject: "YudeesAtelier - Verify Your Email"
                }
            })
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        revokeSessionsOnPasswordReset: true,
        maxPasswordLength: 128,
        minPasswordLength: 5,
        password: {
            hash: async (password) => {
                // Use the same hashing method as the one in lib/encryption.ts
                const cryptoService = CryptoService.getInstance();
                return await cryptoService.hashPassword(password);
            },
            verify: async ({ password, hash }) => {
                const cryptoService = CryptoService.getInstance();
                return await cryptoService.verifyPassword(password, hash);
            },
        },
        async sendResetPassword(data) {
            const user = data.user
            const token = data.token
            const emailHtml = await ResetPasswordEmailHTML({
                username: user.name,
                token
            })
            // ! Important: add queue email sending here for nodemailer
            console.info(`[Auth] Sending reset password email to ${user.email}`);
            await inngest.send({
                name: "marketing/email",
                data: {
                    html: emailHtml,
                    to: user.email,
                    subject: "YudeesAtelier - Reset Your Password"
                }
            })
        },
    },
    session: {
        // expiresIn: 60 * 60 * 24 * 7, // 7 days
        // updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
        cookieCache: {
            enabled: true,
            maxAge: 60 // Cache duration in seconds
        }
    },
});

export type AuthSession = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user