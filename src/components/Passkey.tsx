// src/components/Passkey.tsx
import {authClient} from "@/lib/auth-client";

interface PasskeyProps {
    isLoggedIn: boolean;
}

export function Passkey({isLoggedIn}: PasskeyProps) {
    // ログイン（認証）処理
    const handlePasskeySignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        await authClient.signIn.passkey({
            fetchOptions: {
                onSuccess() {
                    window.location.href = "/";
                },
                onError(ctx) {
                    console.error("Authentication failed:", ctx.error.message);
                    alert("ログインに失敗しました");
                }
            }
        });
    };

    // パスキー追加処理
    const handleAddPasskey = async () => {
        const name = prompt("パスキーの名前を入力してください", "My Passkey");
        if (!name) return;

        await authClient.passkey.addPasskey({
            name,
            fetchOptions: {
                onSuccess: () => alert("パスキーを登録しました！"),
                onError: (ctx) => alert(ctx.error.message || "登録に失敗しました")
            }
        });
    };

    return (
        <div>
            {isLoggedIn ? (
                <button
                    onClick={handleAddPasskey}
                    type="button"
                >
                    パスキーを追加
                </button>
            ) : (
                <button
                    onClick={handlePasskeySignIn}
                    type="button"
                >
                    パスキーでログイン
                </button>
            )}
        </div>
    );
}