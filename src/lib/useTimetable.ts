import { useState, useEffect } from 'react';
import type { FlatSchedule, CourseWithSchedules } from "@/db/schema";
import { type ProcessedSchedule, computeProcessedSchedules } from "@/lib/timetable";

export function useTimetable({
                                 initialCourseIds = [],
                                 initialSchedules = [],
                                 user
                             }: {
    initialCourseIds?: number[],
    initialSchedules?: ProcessedSchedule[],
    user: any
}) {
    // 状態管理
    const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set(initialCourseIds));
    const [schedules, setSchedules] = useState<ProcessedSchedule[]>(initialSchedules);

    // 初期化: localStorage からデータを復元
    useEffect(() => {
        const init = () => {
            if (user) {
                // ログインユーザーの場合は SSR の値をセット
                setRegisteredIds(new Set(initialCourseIds));
            } else {
                // ゲストモード: localStorage から直接 ID を抽出する
                const localData = localStorage.getItem('guest_timetable');
                if (localData) {
                    try {
                        const rawData = JSON.parse(localData) as FlatSchedule[];
                        // スケジュールが空でも、各オブジェクトの courseId または id を元に Set を作成
                        // 提供されたデータでは "id" フィールドにコースIDが入っているため、両方チェックする
                        const ids = new Set(rawData.map(item => Number(item.courseId || (item as any).id)));

                        setRegisteredIds(ids);
                        setSchedules(computeProcessedSchedules(rawData));
                    } catch (e) {
                        console.error("Failed to parse local storage", e);
                    }
                }
            }
        };
        init();
    }, [user, initialCourseIds]);

    const toggleCourse = async (course: CourseWithSchedules) => {
        const courseId = Number(course.id);

        // 常に最新の registeredIds を参照して判定
        if (user) {
            try {
                const res = await fetch('/api/user-courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId }),
                });
                const data = (await res.json()) as { action: "added" | "removed" };

                if (data.action === "added") {
                    setRegisteredIds(prev => new Set(prev).add(courseId));
                    const courseFlatSchedules: FlatSchedule[] = course.schedules.length > 0
                        ? course.schedules.map(s => ({ ...course, ...s }))
                        : [{ ...course, dayOfWeek: 'None', period: 0 } as any];
                    setSchedules(prev => computeProcessedSchedules([...prev, ...courseFlatSchedules]));
                } else {
                    setRegisteredIds(prev => {
                        const next = new Set(prev);
                        next.delete(courseId);
                        return next;
                    });
                    setSchedules(prev => computeProcessedSchedules(prev.filter(s => (s.courseId || (s as any).id) !== courseId)));
                }
            } catch (e) {
                console.error("Toggle failed", e);
            }
        } else {
            // --- ゲストモード ---
            const localRaw = JSON.parse(localStorage.getItem('guest_timetable') || '[]') as FlatSchedule[];

            // IDの存在チェック (数値として比較)
            const isAlreadyAdded = localRaw.some(item => Number(item.courseId || (item as any).id) === courseId);

            let nextRaw: FlatSchedule[];

            if (isAlreadyAdded) {
                // 削除処理
                nextRaw = localRaw.filter(item => Number(item.courseId || (item as any).id) !== courseId);
            } else {
                // 追加処理
                const newEntries: FlatSchedule[] = course.schedules.length > 0
                    ? course.schedules.map(s => ({ ...course, ...s }))
                    : [{ ...course, dayOfWeek: 'None', period: 0 } as any];
                nextRaw = [...localRaw, ...newEntries];
            }

            // localStorage を更新
            localStorage.setItem('guest_timetable', JSON.stringify(nextRaw));

            // State を一括更新
            const nextIds = new Set(nextRaw.map(item => Number(item.courseId || (item as any).id)));
            setRegisteredIds(nextIds);
            setSchedules(computeProcessedSchedules(nextRaw));
        }
    };

    return { registeredIds, schedules, toggleCourse };
}