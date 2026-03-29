import React, {useState} from 'react';
import {authClient, signInWithGoogle} from "@/lib/auth-client.ts";

export default function LoginButton({isLoggedIn}: { isLoggedIn: boolean }) {
    const [isLoading, setIsLoading] = useState(false);

    // ログアウト処理
    const handleLogout = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await authClient.signOut();
            window.location.reload();
        } catch (error) {
            console.error(error);
            setIsLoading(false); // 失敗時のみ戻す（成功時はリロードされるため）
        }
    };

    // Googleログイン処理
    const handleGoogleLogin = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            alert("ログインに失敗しました");
        }
    };

    return (
        <div>
            {isLoggedIn ? (
                <button
                    onClick={handleLogout}
                    disabled={isLoading}
                >
                    {isLoading ? "ログアウト中..." : "ログアウト"}
                </button>
            ) : (
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? "Googleへ接続中..." : "Googleでログイン"}
                </button>
            )}
        </div>
    );
}