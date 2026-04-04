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
            const res = await fetch('/api/user-courses/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseItems: items }),
            });

            if (!res.ok) throw new Error();

            setSyncStatus('done');
            localStorage.removeItem('guest_timetable');
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            setSyncStatus('error');
        }
    };

    useEffect(() => {
        if (user?.id) handleSync();
    }, [user?.id]);

    return { syncStatus };
}

