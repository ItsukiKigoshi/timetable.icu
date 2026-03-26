import { authClient } from "@/lib/auth-client";

export function Passkey() {
    const { data: session } = authClient.useSession();

    const handlePasskeySignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        await authClient.signIn.passkey({
            fetchOptions: {
                onSuccess() {
                    window.location.href = "/";
                },
                onError(ctx) {
                    console.error("Authentication failed:", ctx.error.message);
                }
            }
        });
    };

    const handleAddPasskey = async () => {
        const name = prompt("パスキーの名前を入力してください (例: MacBookの指紋)", "My Passkey");
        if (!name) return;

        await authClient.passkey.addPasskey({
            name,
            fetchOptions: {
                onSuccess: () => {
                    alert("パスキーを登録しました！");
                },
                onError: (ctx) => {
                    alert(ctx.error.message || "登録に失敗しました");
                }
            }
        });
    };

    return (
        <div className="flex gap-2">
            {session ? (
                <button onClick={handleAddPasskey} type="button">
                    パスキーを追加
                </button>
            ) : (
                <button onClick={handlePasskeySignIn} type="button">
                    パスキーでログイン
                </button>
            )}
        </div>
    );
}