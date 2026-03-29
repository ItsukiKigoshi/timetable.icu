import React, {useEffect, useState} from 'react';
import {authClient} from "@/lib/auth-client.ts";

export default function PasskeyList({isLoggedIn}: { isLoggedIn: boolean }) {
    const [isLoading, setIsLoading] = useState(false);

    const [passkeys, setPasskeys] = useState<any[]>([]);

    // パスキー一覧を取得する関数
    const fetchPasskeys = async () => {
        const {data, error} = await authClient.passkey.listUserPasskeys();
        if (data) {
            setPasskeys(data);
        }
    };

    // ログイン済みなら初期表示時にリストを取得
    useEffect(() => {
        if (isLoggedIn) {
            fetchPasskeys();
        }
    }, [isLoggedIn]);


    // パスキー削除処理
    const handleDeletePasskey = async (id: string) => {
        if (!confirm("このパスキーを削除してもよろしいですか？")) return;

        setIsLoading(true);
        const {error} = await authClient.passkey.deletePasskey({id});

        if (error) {
            alert(error.message || "削除に失敗しました");
        } else {
            // 削除に成功したらリストから除外する
            setPasskeys(prev => prev.filter(pk => pk.id !== id));
        }
        setIsLoading(false);
    };

    return (
        <div>
            {isLoggedIn && passkeys.length > 0 && (
                <div>
                    <h3>登録済みのパスキー</h3>
                    <ul>
                        {passkeys.map((pk) => (
                            <li key={pk.id}>
                                <div>
                                    <span>{pk.name || "名称未設定"}</span>
                                    <p>ID: {pk.id.substring(0, 8)}...</p>
                                </div>
                                <button
                                    onClick={() => handleDeletePasskey(pk.id)}
                                    disabled={isLoading}
                                >
                                    削除
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )
            }
        </div>
    )
}