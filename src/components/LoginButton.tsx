import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { Passkey } from "./Passkey.tsx";

export default function LoginButton() {
    const { data: session, isPending } = authClient.useSession();

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    if (isPending) return <div>Loading...</div>;

    return (
        <div>
            <div>
                {session ? (
                    <>
                        <button onClick={handleLogout}>
                            ログアウト
                        </button>
                        {/* ログイン後：パスキー追加ボタンを表示 */}
                        <Passkey />
                    </>
                ) : (
                    <>
                        <button onClick={() => signInWithGoogle()}>
                            Google (icu.ac.jp) でログイン
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