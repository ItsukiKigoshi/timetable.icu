import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { Passkey } from "./Passkey.tsx";

export default function LoginButton() {
    const { data: session, isPending } = authClient.useSession();

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    if (isPending) return <div className="animate-pulse">Loading...</div>;

    return (
        <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-2">
                {session ? (
                    <>
                        <button onClick={handleLogout} className="btn-secondary">
                            ログアウト
                        </button>
                        {/* ログイン後：パスキー追加ボタンを表示 */}
                        <Passkey />
                    </>
                ) : (
                    <>
                        <button onClick={() => signInWithGoogle()} className="btn-primary">
                            Googleでログイン
                        </button>
                        {/* ログイン前：パスキーログインボタンを表示 */}
                        <Passkey />
                    </>
                )}
            </div>

            {/* 条件付きUI（オートフィル）を動作させるための隠し入力フィールド */}
            {!session && (
                <input
                    type="text"
                    autoComplete="username webauthn"
                    className="hidden"
                    aria-hidden="true"
                />
            )}
        </div>
    );
}