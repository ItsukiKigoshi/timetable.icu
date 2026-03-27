import { useState, useEffect } from 'react'; // useEffect を追加
import type { FlatSchedule, CourseWithSchedules } from "@/db/schema";
import { type ProcessedSchedule, computeProcessedSchedules } from "@/lib/timetable";
import {syncLocalStorageToDB} from "@/lib/sync";

export function useTimetable({ processedSchedules, user }: { processedSchedules: ProcessedSchedule[], user: any }) {
    // SSRで渡されたデータで初期化
    const [schedules, setSchedules] = useState<ProcessedSchedule[]>(processedSchedules);

    useEffect(() => {
        const init = async () => {
            const localData = localStorage.getItem('guest_timetable');
            if (!localData) return;

            const rawData = JSON.parse(localData) as FlatSchedule[];
            if (rawData.length === 0) return;

            // --- パターンA: ログイン済みなら同期を試みる ---
            if (user) {
                const courseIds = Array.from(new Set(rawData.map(s => s.courseId)));
                const confirmSync = window.confirm(`ゲストとして保存していた ${courseIds.length} 件の授業をアカウントに保存しますか？`);

                if (confirmSync) {
                    try {
                        await syncLocalStorageToDB(courseIds);
                        alert("✅ 同期に成功しました！");
                        window.location.reload(); // SSRデータを最新にするためリロード
                    } catch (e) {
                        alert("❌ 同期に失敗しました");
                    }
                }
            }
            // --- パターンB: 未ログインなら表示用にセットする ---
            else if (processedSchedules.length === 0) {
                setSchedules(computeProcessedSchedules(rawData));
            }
        };

        init();
    }, [user, processedSchedules]);

    const toggleCourse = async (course: CourseWithSchedules) => {
        const courseId = course.id;
        const courseFlatSchedules: FlatSchedule[] = course.schedules.map(s => ({ ...course, ...s }));

        if (user) {
            try {
                const res = await fetch('/api/user-courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId }),
                });
                const data = (await res.json()) as { action: "added" | "removed" };

                if (data.action === "added") {
                    setSchedules(prev => computeProcessedSchedules([...prev, ...courseFlatSchedules]));
                } else {
                    setSchedules(prev => computeProcessedSchedules(prev.filter(s => s.courseId !== courseId)));
                }
            } catch (e) {
                alert("通信に失敗しました");
            }
        } else {
            // Guest mode (localStorage)
            const localRaw = JSON.parse(localStorage.getItem('guest_timetable') || '[]') as FlatSchedule[];
            const isAdded = localRaw.some(s => s.courseId === courseId);

            const nextRaw = isAdded
                ? localRaw.filter(s => s.courseId !== courseId)
                : [...localRaw, ...courseFlatSchedules];

            localStorage.setItem('guest_timetable', JSON.stringify(nextRaw));
            setSchedules(computeProcessedSchedules(nextRaw));
        }
    };

    return { schedules, toggleCourse };
}