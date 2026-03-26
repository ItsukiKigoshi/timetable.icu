import { createAuthClient } from "better-auth/react";
import { env } from "cloudflare:workers";

export const authClient = createAuthClient({
    baseURL: env.BETTER_AUTH_URL
});

export const signInWithGoogle = async () => {
    const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
    });

    if (error) {
        console.error("Login failed:", error.message);
        throw error;
    }

    return data;
};