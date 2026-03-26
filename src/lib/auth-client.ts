import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.PROD
        ? "https://timetable-icu.pages.dev"
        : "http://localhost:4321",
});

export const signInWithGoogle = async () => {
    const { data, error } = await authClient.signIn.social({
        provider: "google",
        // ログイン完了後のリダイレクト先を指定したい場合はここに追加
        callbackURL: "/",
    });

    if (error) {
        console.error("Login failed:", error.message);
        throw error;
    }

    return data;
};