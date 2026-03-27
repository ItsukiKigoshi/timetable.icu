import React, { useState, useEffect } from 'react';
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { syncLocalStorageToDB } from "@/lib/sync";

export default function LoginButton({ isLoggedIn }:{isLoggedIn:boolean}) {
    const [hasLocalData, setHasLocalData] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");

    // localStorageにデータがあるかチェック
    useEffect(() => {
        const data = localStorage.getItem('guest_timetable');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHasLocalData(true);
                }
            } catch (e) {
                console.error("Failed to parse guest data", e);
            }
        }
    }, []);

    // ログイン済みかつゲストデータがある場合に自動同期を実行
    useEffect(() => {
        if (isLoggedIn && hasLocalData && !isSyncing) {
            handleSync();
        }
    }, [isLoggedIn, hasLocalData]);

    const handleSync = async () => {
        const data = localStorage.getItem('guest_timetable');
        if (!data) return;

        setIsSyncing(true);
        setSyncMessage("データを同期中...");

        try {
            const raw = JSON.parse(data);

            // スケジュールがある授業(courseId)とない授業(id)の両方からIDを抽出
            const ids: number[] = Array.from(new Set(
                raw.map((item: { courseId: number; id: number; }) => {
                    const val = item.courseId || item.id;
                    return Number(val);
                }).filter((id: number) => !isNaN(id) && id > 0)
            ));

            if (ids.length > 0) {
                await syncLocalStorageToDB(ids);

                // データのクリーンアップ
                localStorage.removeItem('guest_timetable');
                localStorage.removeItem('guest_registered_ids');
                setHasLocalData(false);

                setSyncMessage("同期が完了しました！");

                // 少し待ってからリロード（完了メッセージを見せるため）
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setHasLocalData(false);
                setSyncMessage("");
            }
        } catch (e) {
            console.error("Sync failed", e);
            setSyncMessage("同期に失敗しました。");
            setIsSyncing(false);
        }
    };

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    return (
        <div>
            {/* 同期ステータス通知 */}
            {syncMessage && (
                <div>
                    {syncMessage}
                </div>
            )}

            <div>
                {isLoggedIn ? (
                    <button
                        onClick={handleLogout}
                    >
                        ログアウト
                    </button>
                ) : (
                    <button
                        onClick={() => signInWithGoogle()}
                    >
                        Googleでログイン
                    </button>
                )}
            </div>
        </div>
    );
}