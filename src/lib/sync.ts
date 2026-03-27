export const syncLocalStorageToDB = async (courseIds: number[]) => {
    if (courseIds.length === 0) return { success: true };

    const res = await fetch('/api/user-courses/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds }),
    });

    if (!res.ok) throw new Error("Sync failed");

    localStorage.removeItem('guest_timetable');
    return await res.json();
};
