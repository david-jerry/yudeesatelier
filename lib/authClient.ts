import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "@better-auth/passkey/client"
import { inferAdditionalFields, multiSessionClient } from "better-auth/client/plugins"
import { auth } from "./auth";
import { config } from "@/config";

export const authClient = createAuthClient({
    baseURL: config.BASE_URL,
    plugins: [
        passkeyClient(),
        multiSessionClient(),
        inferAdditionalFields<typeof auth>(),
    ],
    fetchOptions: {
        onError(e) {
            if (e.error.status === 429) {
                alert("Too many requests. Please try again later.");
            }
        },
    },
})