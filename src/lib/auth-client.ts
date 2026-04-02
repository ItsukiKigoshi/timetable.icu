import {createAuthClient} from "better-auth/react";
import {passkeyClient} from "@better-auth/passkey/client"

export const authClient = createAuthClient({
    baseURL: import.meta.env.PUBLIC_BASE_URL || window.location.origin,
    plugins: [
        passkeyClient()
    ]
});

export const signInWithGoogle = async () => {
    const {data, error} = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
    });

    if (error) {
        console.error("Login failed:", error.message);
        throw error;
    }

    return data;
};