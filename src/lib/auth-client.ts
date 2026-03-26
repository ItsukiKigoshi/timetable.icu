import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.BETTER_AUTH_URL || "http://localhost:4321"
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