import {createAuthClient} from "better-auth/react";
import {passkeyClient} from "@better-auth/passkey/client"

export const client = createAuthClient({
    baseURL: import.meta.env.PUBLIC_BASE_URL,
    plugins: [
        passkeyClient()
    ]
});

export const signInWithGoogle = async (currentOrigin?: string) => {
    const origin = currentOrigin || (typeof window !== "undefined" ? window.location.origin : "");

    const { data, error } = await client.signIn.social({
        provider: "google",
        callbackURL: origin,
    });

    if (error) throw error;
    return data;
};