import {useEffect, useMemo, useState} from 'react';
import type {FlatSchedule} from "@/db/schema";
import {computeProcessedSchedules} from "@/lib/timetable";

export function useTimetable({
                                 initialCourseIds = [],
                                 initialSchedules = [],
                                 user
                             }: {
    initialCourseIds?: number[],
    initialSchedules?: FlatSchedule[],
    user: any
}) {
    const [rawSchedules, setRawSchedules] = useState<FlatSchedule[]>(initialSchedules);
    const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set(initialCourseIds));
    // 読み込み完了状態を管理
    const [isInitialized, setIsInitialized] = useState(false);

    const displaySchedules = useMemo(() => {
        return computeProcessedSchedules(rawSchedules);
    }, [rawSchedules]);

    const updateAll = (nextRaw: FlatSchedule[]) => {
        setRawSchedules(nextRaw);
        const nextIds = new Set(nextRaw.map(s => Number(s.courseId || (s as any).id)));
        setRegisteredIds(nextIds);
        if (!user) {
            localStorage.setItem('guest_timetable', JSON.stringify(nextRaw));
        }
    };

    useEffect(() => {
        if (!user) {
            const localData = localStorage.getItem('guest_timetable');
            if (localData) {
                try {
                    const rawData = JSON.parse(localData) as FlatSchedule[];
                    updateAll(rawData);
                } catch (e) {
                    console.error("Failed to parse local storage", e);
                }
            }
        }
        setIsInitialized(true); // 読み込み（または判定）完了
    }, [user]);

    const toggleCourse = async (course: any) => {
        const targetCourseId = Number(course.courseId || course.id);
        const isRegistered = registeredIds.has(targetCourseId);

        // --- 追加: スケジュールが空の場合は追加させない ---
        const schedulesToProcess = course.schedules || (course.dayOfWeek ? [course] : []);
        if (!isRegistered && schedulesToProcess.length === 0) {
            alert("この授業にはスケジュール情報がないため、時間割に追加できません。");
            return;
        }

        if (user) {
            try {
                const res = await fetch('/api/user-courses', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({courseId: targetCourseId}),
                });
                const data = (await res.json()) as { action: "added" | "removed" };

                if (data.action === "added") {
                    const newEntries: FlatSchedule[] = schedulesToProcess.map((s: any) => ({
                        ...course,
                        ...s,
                        courseId: targetCourseId
                    }));
                    updateAll([...rawSchedules, ...newEntries]);
                } else {
                    updateAll(rawSchedules.filter(s => Number(s.courseId || (s as any).id) !== targetCourseId));
                }
            } catch (e) {
                console.error("Toggle failed", e);
            }
        } else {
            if (isRegistered) {
                updateAll(rawSchedules.filter(s => Number(s.courseId || (s as any).id) !== targetCourseId));
            } else {
                const newEntries: FlatSchedule[] = schedulesToProcess.map((s: any) => ({
                    ...course,
                    ...s,
                    courseId: targetCourseId
                }));
                updateAll([...rawSchedules, ...newEntries]);
            }
        }
    };

    return {registeredIds, schedules: rawSchedules, displaySchedules, toggleCourse, isInitialized};
}