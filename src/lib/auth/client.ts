import {createAuthClient} from "better-auth/react";
import {passkeyClient} from "@better-auth/passkey/client"

export const client = createAuthClient({
    baseURL: typeof window !== "undefined"
        ? window.location.origin
        : import.meta.env.PUBLIC_BASE_URL,
    plugins: [
        passkeyClient()
    ]
});

export const signInWithGoogle = async () => {
    const callbackURL = typeof window !== "undefined"
        ? window.location.href  // これで /timetable や /explore が保持される
        : (import.meta.env.PUBLIC_BASE_URL || "");

    const { data, error } = await client.signIn.social({
        provider: "google",
        callbackURL: callbackURL,
    });

    if (error) throw error;
    return data;
};