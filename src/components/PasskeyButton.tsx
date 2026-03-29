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
                    className="btn w-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         className="lucide lucide-key-round-icon lucide-key-round">
                        <path
                            d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/>
                        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
                    </svg>
                    {isLoading ? "Passkeyを登録中..." : "Passkeyを追加"}
                </button>
            ) : (
                <button
                    onClick={handlePasskeySignIn}
                    disabled={isLoading}
                    className="btn bg-white text-black border-[#e5e5e5] w-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         className="lucide lucide-user-key-icon lucide-user-key">
                        <path d="M20 11v6"/>
                        <path d="M20 13h2"/>
                        <path d="M3 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 2.072.578"/>
                        <circle cx="10" cy="7" r="4"/>
                        <circle cx="20" cy="19" r="2"/>
                    </svg>
                    {isLoading ? "Passkeyで認証中..." : "Passkeyでログイン"}
                </button>
            )}
        </div>
    )
}