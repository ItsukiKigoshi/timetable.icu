import { authClient, signInWithGoogle } from "@/lib/auth-client";

export default function LoginButton() {
    const { data: session, isPending } = authClient.useSession();

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    if (isPending) return <div className="animate-pulse">Loading...</div>;

    return (
        <div className="flex gap-2">
            {session ? (
                <>
                    <button onClick={handleLogout} className="btn-secondary">
                        ログアウト
                    </button>
                </>
            ) : (
                <button onClick={() => signInWithGoogle()} className="btn-primary">
                    Googleでログイン
                </button>
            )}
        </div>
    );
}