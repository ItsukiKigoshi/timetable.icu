import {useEffect, useState} from 'react';

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
        // 1. 同期が必要なのは「ゲストデータ」がある時だけにする
        const guestData = localStorage.getItem('guest_timetable');

        // ユーザーがいない、またはゲストデータがないなら何もしない
        if (!user || !guestData) return;

        try {
            const items = JSON.parse(guestData);
            if (!Array.isArray(items) || items.length === 0) {
                localStorage.removeItem('guest_timetable'); // 空なら消して終了
                return;
            }

            setStatus('syncing');
            setShowToast(true);

            await syncData(items);

            setStatus('done');

            // 2. 成功したらゲストデータを削除
            localStorage.removeItem('guest_timetable');

            // 3. 2秒後にトーストを閉じる（リロードはしない）
            // リロードしなくても、次のページ遷移やuseTimetableの初期化で最新DBが読み込まれます
            setTimeout(() => {
                setShowToast(false);
                setStatus('idle');
                // もし今のページが時間割ページなら、ここだけ window.location.reload() しても良いですが、
                // 基本はUI側でデータの再取得を促す方がスマートです。
            }, 2000);

        } catch (e) {
            console.error("Sync error:", e);
            setStatus('error');
            setTimeout(() => setShowToast(false), 5000);
        }
    };

    // マウント時
    useEffect(() => {
        handleSync();
    }, [user?.id]);

    // オンライン復帰時
    useEffect(() => {
        const handleOnline = () => handleSync();
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