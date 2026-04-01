import {useEffect, useState} from 'react';

const syncData = async (courseIds: number[]) => {
    const res = await fetch('/api/user-courses/sync', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({courseIds}),
    });
    if (!res.ok) throw new Error("Sync failed");
    localStorage.removeItem('guest_timetable');
};

/* Sync LocalStorage with D1 when Login */
export default function SyncHandler({isLoggedIn}: { isLoggedIn: boolean }) {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

    useEffect(() => {
        const rawData = localStorage.getItem('guest_timetable');
        if (!isLoggedIn || !rawData) return;

        (async () => {
            try {
                const ids = JSON.parse(rawData);
                if (!Array.isArray(ids) || ids.length === 0) return;

                setStatus('syncing');
                await syncData(ids);
                setStatus('done');
                setTimeout(() => window.location.reload(), 3000);
            } catch {
                setStatus('error');
            }
        })();
    }, [isLoggedIn]);

    if (status === 'idle') return null;

    return (
        <div
            className="flex flex-col items-center  animate-in fade-in zoom-in">
            {status === 'syncing' && (
                <>
                    <span className="loading loading-ring loading-md text-primary"/>
                    <p className="text-xs font-medium text-base-content/70">データを同期中...</p>
                </>
            )}
            {status === 'done' && (
                <>
                    <div className="text-success text-lg">✓</div>
                    <p className="text-xs font-bold text-success">同期完了！</p>
                </>
            )}
            {status === 'error' && (
                <p className="text-xs text-error font-medium">同期に失敗しました</p>
            )}
        </div>
    );
}