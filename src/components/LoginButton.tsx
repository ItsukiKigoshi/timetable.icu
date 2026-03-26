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
                    </>
                ) : (
                    <>
                        <button onClick={() => signInWithGoogle()}>
                            Google (icu.ac.jp) でログイン
                        </button>
                    </>
                )}
            </div>
            <Passkey/>
        </div>
    );
}