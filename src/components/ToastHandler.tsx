import { useEffect, useState } from 'react';

// 同期用関数
const syncData = async (courseItems: any[]) => {
    const res = await fetch('/api/user-courses/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseItems }),
    });
    if (!res.ok) throw new Error("Sync failed");
};

export default function ToastHandler({ user }: { user?: any }) {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error' | 'domain_error'>('idle');
    const [show, setShow] = useState(false);

    // --- ロジック1: ドメインエラーの監視 (URLパラメータ) ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("error") === "INVALID_DOMAIN") {
            setStatus('domain_error');
            setShow(true);

            // URLを綺麗にする
            const url = new URL(window.location.href);
            url.searchParams.delete("error");
            window.history.replaceState({}, "", url.pathname);

            // 8秒後に消す
            setTimeout(() => setShow(false), 8000);
        }
    }, []);

    // --- ロジック2: データ同期の実行 ---
    const handleSync = async () => {
        const guestData = localStorage.getItem('guest_timetable');
        if (!user || !guestData) return;

        try {
            const items = JSON.parse(guestData);
            if (!Array.isArray(items) || items.length === 0) {
                localStorage.removeItem('guest_timetable');
                return;
            }

            setStatus('syncing');
            setShow(true);

            await syncData(items);

            setStatus('done');
            localStorage.removeItem('guest_timetable');

            // 完了したら2秒後にリロード
            setTimeout(() => {
                setShow(false);
                window.location.reload();
            }, 2000);

        } catch (e) {
            console.error("Sync error:", e);
            setStatus('error');
            setTimeout(() => setShow(false), 5000);
        }
    };

    useEffect(() => {
        if (user?.id) handleSync();
    }, [user?.id]);

    if (!show) return null;

    // --- 見た目 (DaisyUIのToast) ---
    return (
        <div className="toast toast-top toast-center z-100">
            {/* ドメインエラー */}
            {status === 'domain_error' && (
                <div className="alert alert-error shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span className="text-sm">ログインにはICUのアカウント（@icu.ac.jp）が必要です<br/>Please use ICU account (@icu.ac.jp) to Login</span>
                </div>
            )}

            {/* 同期中 */}
            {status === 'syncing' && (
                <div className="alert alert-info shadow-lg">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>データを同期しています... / Syncing...</span>
                </div>
            )}

            {/* 同期完了 */}
            {status === 'done' && (
                <div className="alert alert-success shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>同期完了！再読み込みします...</span>
                </div>
            )}

            {/* 同期失敗 */}
            {status === 'error' && (
                <div className="alert alert-warning shadow-lg">
                    <span>同期に失敗しました。接続を確認してください。</span>
                </div>
            )}
        </div>
    );
}