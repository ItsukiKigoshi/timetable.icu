import React, {useState} from 'react';
import {authClient} from "@/lib/auth-client.ts";

// Default Passkey Name
const getDeviceDisplayName = () => {
    const ua = navigator.userAgent;
    let browser = "";
    let platform = "";

    // ブラウザ判定
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    // OS/デバイス判定
    if (ua.includes("iPhone")) platform = "iPhone";
    else if (ua.includes("iPad")) platform = "iPad";
    else if (ua.includes("Android")) platform = "Android";
    else if (ua.includes("Windows")) platform = "Windows PC";
    else if (ua.includes("Mac OS X")) platform = "Mac";
    else if (ua.includes("Linux")) platform = "Linux";

    return `(${browser} on ${platform})`;
};


export default function PasskeyButton({isLoggedIn}: { isLoggedIn: boolean }) {
    const [isLoading, setIsLoading] = useState(false);

    // ログイン処理
    const handlePasskeySignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isLoading) return; // 念のためガード

        setIsLoading(true); // 処理開始
        await authClient.signIn.passkey({
            fetchOptions: {
                onSuccess() {
                    window.location.reload();
                },
                onError(ctx) {
                    setIsLoading(false); // 失敗時はボタンを元に戻す
                    console.error("Authentication failed:", ctx.error.message);
                    alert("ログインに失敗しました。");
                }
            }
        });
    };

    // パスキー追加処理
    const handleAddPasskey = async () => {
        const defaultName = `Passkey ${getDeviceDisplayName()}`;
        const name = prompt("Passkeyの名前はどうしますか？", defaultName);
        if (!name) return;

        setIsLoading(true); // 処理開始
        await authClient.passkey.addPasskey({
            name,
            fetchOptions: {
                onSuccess: () => {
                    setIsLoading(false);
                    alert("Passkeyを登録しました！");
                },
                onError: (ctx) => {
                    setIsLoading(false);
                    alert(ctx.error.message || "Passkeyでのログインに失敗しました. まだ登録していない場合は, まずGoogleでログインしてください");
                }
            }
        });
        window.location.reload();
    };

    return (
        <div>
            {isLoggedIn ? (
                <button
                    onClick={handleAddPasskey}
                    disabled={isLoading}
                >
                    {isLoading ? "Passkeyを登録中..." : "Passkeyを追加"}
                </button>
            ) : (
                <button
                    onClick={handlePasskeySignIn}
                    disabled={isLoading}
                >
                    {isLoading ? "Passkeyで認証中..." : "Passkeyでログイン"}
                </button>
            )}
        </div>
    )
}