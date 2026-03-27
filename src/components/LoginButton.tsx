// LoginButton.tsx (React)
import {authClient, signInWithGoogle} from "@/lib/auth-client";

interface Props {
    isLoggedIn: boolean;
}

export default function LoginButton({isLoggedIn}: Props) {
    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    return (
        <div>
            {isLoggedIn ? (
                <button onClick={handleLogout}>ログアウト</button>
            ) : (
                <button onClick={() => signInWithGoogle()}>
                    Google (icu.ac.jp) でログイン
                </button>
            )}
        </div>
    );
}