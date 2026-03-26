import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";

export function Passkey() {
    const { data: session } = authClient.useSession();

    // ブラウザのオートフィル（Conditional UI）の有効化
    useEffect(() => {
        const setupAutoFill = async () => {
            if (typeof window !== "undefined" &&
                window.PublicKeyCredential &&
                await window.PublicKeyCredential.isConditionalMediationAvailable?.()) {

                await authClient.signIn.passkey({
                    autoFill: true,
                    fetchOptions: {
                        onSuccess: () => {
                            window.location.reload();
                        }
                    }
                });
            }
        };
        if (!session) setupAutoFill();
    }, [session]);

    const handlePasskeySignIn = async () => {
        await authClient.signIn.passkey({
            fetchOptions: {
                onSuccess: () => {
                    window.location.reload();
                },
                onError: (ctx) => {
                    alert(ctx.error.message || "パスキーでのログインに失敗しました");
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
                <button onClick={handleAddPasskey} className="btn-outline">
                    パスキーを追加
                </button>
            ) : (
                <button onClick={handlePasskeySignIn} className="btn-secondary">
                    パスキーでログイン
                </button>
            )}
        </div>
    );
}