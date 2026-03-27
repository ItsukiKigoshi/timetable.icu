// src/components/LoginButton.tsx
import { useState, useEffect } from 'react';
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { syncLocalStorageToDB } from "@/lib/sync";

export default function LoginButton({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [hasLocalData, setHasLocalData] = useState(false);

    // localStorageにデータがあるかチェック
    useEffect(() => {
        const data = localStorage.getItem('guest_timetable');
        if (data && JSON.parse(data).length > 0) {
            setHasLocalData(true);
        }
    }, []);

    const handleSync = async () => {
        const data = localStorage.getItem('guest_timetable');
        if (!data) return;

        const raw = JSON.parse(data);
        const ids = Array.from(new Set(raw.map((s: any) => s.courseId))) as number[];

        try {
            await syncLocalStorageToDB(ids);
            alert("✅ 同期が完了しました！");
            window.location.reload(); // 最新のDBデータを反映
        } catch (e) {
            alert("❌ 同期に失敗しました");
        }
    };

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    return (
        <div>
            {isLoggedIn ? (
                <>
                    {hasLocalData && (
                        <button
                            onClick={handleSync}
                        >
                            未保存のデータを同期
                        </button>
                    )}
                    <button onClick={handleLogout}>
                        ログアウト
                    </button>
                </>
            ) : (
                <button onClick={() => signInWithGoogle()}>
                    Googleでログイン
                </button>
            )}
        </div>
    );
}