import {useEffect, useState} from 'react';

// APIにデータを送る共通関数
const syncData = async (courseItems: any[]) => {
    const res = await fetch('/api/user-courses/sync', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({courseItems}),
    });
    if (!res.ok) throw new Error("Sync failed");
};

export default function SyncHandler({user}: { user: any }) {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
    const [showToast, setShowToast] = useState(false);

    const handleSync = async () => {
        const guestData = localStorage.getItem('guest_timetable');
        const cacheKey = user ? `cache_timetable_${user.id}` : null;
        const cachedData = cacheKey ? localStorage.getItem(cacheKey) : null;

        // 同期すべきソースを決定（ゲスト優先）
        const targetData = guestData || cachedData;
        if (!user || !targetData) return;

        try {
            const items = JSON.parse(targetData);
            if (!Array.isArray(items) || items.length === 0) return;

            setStatus('syncing');
            setShowToast(true);

            await syncData(items);

            setStatus('done');

            // 重要：同期に成功したソースだけを削除
            if (guestData) {
                localStorage.removeItem('guest_timetable');
            } else if (cacheKey) {
                localStorage.removeItem(cacheKey); // キャッシュもクリアしてDBを正とする
            }

            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            console.error(e);
            setStatus('error');
            setTimeout(() => setShowToast(false), 5000);
        }
    };

    // A. マウント時（ログイン直後）の同期
    useEffect(() => {
        if (user) handleSync();
    }, [user?.id]);

    // B. オンライン復帰時の検知
    useEffect(() => {
        const handleOnline = () => {
            if (user) handleSync();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [user]);

    if (!showToast) return null;

    return (
        <div className="toast toast-top toast-center z-100">
            {status === 'syncing' && (
                <div className="alert alert-info shadow-lg flex items-center gap-3">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>データを同期しています...</span>
                </div>
            )}
            {status === 'done' && (
                <div className="alert alert-success shadow-lg">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>同期完了！再読み込みします．</span>
                    </div>
                </div>
            )}
            {status === 'error' && (
                <div className="alert alert-error shadow-lg">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>同期に失敗しました．接続を確認してください．</span>
                    </div>
                </div>
            )}
        </div>
    );
}