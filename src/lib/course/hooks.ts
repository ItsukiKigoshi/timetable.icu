import {useEffect, useState} from 'react';

// ゲストデータをサーバーへ移す
export function useSync(user: any) {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

    const handleSync = async () => {
        const guestData = localStorage.getItem('guest_timetable');
        if (!user || !guestData) return;

        try {
            const items = JSON.parse(guestData);
            if (!Array.isArray(items) || items.length === 0) {
                localStorage.removeItem('guest_timetable');
                return;
            }

            setSyncStatus('syncing');
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseItems: items }),
            });

            if (!res.ok) throw new Error("Server responded with an error");

            // レスポンスを解析して、実際に処理された件数を確認
            const result = await res.json() as {
                success: boolean,
                syncedNormal: number,
                syncedCustom: number
            };

            // 少なくとも1件以上の処理が成功している、または空でないことを確認
            if (result.success) {
                // --- バックアップ処理 (最新1件のみ残す) ---
                // 1. 古いバックアップを削除
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('guest_timetable_bak_')) {
                        localStorage.removeItem(key);
                    }
                });

                // 2. 新しいバックアップを保存 (タイムスタンプ付き)
                const timestamp = new Date().getTime();
                localStorage.setItem(`guest_timetable_bak_${timestamp}`, guestData);

                // 3. 元のデータを削除
                localStorage.removeItem('guest_timetable');

                setSyncStatus('done');

                // データの整合性を保つため、少し待ってからリロード
                setTimeout(() => window.location.reload(), 2000);
            } else {
                throw new Error("Sync was not successful according to API");
            }

        } catch (e) {
            console.error("Sync process failed:", e);
            setSyncStatus('error');
        }
    };

    useEffect(() => {
        if (user?.id) handleSync();
    }, [user?.id]);

    return { syncStatus };
}