// TODO - Refactor

import {useEffect, useMemo, useState} from 'react';
import type {FlatSchedule} from "@/db/schema";
import {SELECTABLE_DAYS} from "@/constants/time";


// Hour to Minute
export const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// サーバー・クライアント共通で使う型
interface ProcessedSchedule extends FlatSchedule {
    startMin: number;
    endMin: number;
    col: number;
    groupMaxCols: number;
}


// FlatSchedule -> ProcessedSchedule (with Canvas Setting)
function computeProcessedSchedules(schedules: FlatSchedule[]): ProcessedSchedule[] {
    const allProcessed: ProcessedSchedule[] = [];

    SELECTABLE_DAYS.forEach(day => {
        // 1. 抽出・ソート
        const daySchedules = schedules
            .filter(s => s.dayOfWeek === day)
            .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

        // 2. 結合
        const merged: FlatSchedule[] = [];
        daySchedules.forEach(current => {
            const currentStart = timeToMin(current.startTime);
            const target = merged.find(m => {
                const mEnd = timeToMin(m.endTime);
                // rgNoが一致，かつ時間帯が10分以内であれば結合
                return m.rgNo === current.rgNo && (currentStart - mEnd) <= 10;
            });
            if (target) {
                target.endTime = current.endTime;
            } else {
                merged.push({...current});
            }
        });

        // 3. 衝突・列計算
        const tempWithCol: (FlatSchedule & {
            startMin: number;
            endMin: number;
            col: number;
            displayEndMin: number
        })[] = [];
        merged.forEach(sched => {
            const startMin = timeToMin(sched.startTime);
            const endMin = timeToMin(sched.endTime);

            let col = 0;
            // ...衝突判定ロジック...
            while (tempWithCol.some(c =>
                c.col === col &&
                // 衝突判定。ここでも絶対値(startMin)同士で比較するのでOK
                Math.max(startMin, c.startMin) < Math.min(endMin, c.endMin)
            )) {
                col++;
            }
            tempWithCol.push({...sched as any, startMin, endMin, col});
        });

        // 4. 幅計算
        tempWithCol.forEach(sched => {
            const group = tempWithCol.filter(other =>
                Math.max(sched.startMin, other.startMin) < Math.min(sched.endMin, other.endMin)
            );
            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;
            allProcessed.push({...sched, groupMaxCols});
        });
    });

    return allProcessed;
}

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

    const updateAll = (nextRaw: FlatSchedule[]) => {
        setRawSchedules(nextRaw);

        // courseIdを一意に特定するためのSet更新
        const nextIds = new Set(nextRaw.map(s => Number(s.courseId || (s as any).id)));
        setRegisteredIds(nextIds);

        if (!user) {
            // ゲストモード：roomを除外して保存
            const storageData = nextRaw.map(s => {
                // roomを除外。s.id が courseId か ScheduleId か曖昧になるのを防ぐため明示的に定義
                const {room, ...rest} = s;

                return {
                    ...rest,
                    courseId: Number(s.courseId || (s as any).id),
                    // FlatScheduleを組む際に Schedule.id が Course.id で上書きされている可能性があるため
                    // 確実に「スケジュールのID」として保存
                    scheduleId: s.id,
                    isVisible: s.isVisible ?? true,
                    memo: s.memo ?? null,
                    colorCustom: s.colorCustom ?? null
                };
            });
            localStorage.setItem('guest_timetable', JSON.stringify(storageData));
        } else {
            // ログインモード：DBから取得した「最新のroom情報」を含む全データをキャッシュ
            // ユーザーIDをキーに含めることで、複数アカウント利用時の混線を防ぐ
            localStorage.setItem(`cache_timetable_${user.id}`, JSON.stringify(nextRaw));
        }
    };
    // 描画用データの計算
    const displaySchedules = useMemo(() => {
        // ここで isVisible === false のものを除外してから計算に回す
        const visibleOnly = rawSchedules.filter(s => s.isVisible !== false);
        return computeProcessedSchedules(visibleOnly);
    }, [rawSchedules]);


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

        // --- スケジュールが空の場合は追加させない ---
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

    // 非表示/表示の切り替え関数
    const toggleVisibility = async (course: FlatSchedule) => {
        const targetCourseId = Number(course.courseId || (course as any).id);
        // 現在の状態を反転
        const nextVisibility = course.isVisible === false; // falseならtrueへ、それ以外ならfalseへ

        // 1. ローカル状態の更新 (楽観的更新)
        // 同じcourseIdを持つすべてのコマ（曜限違いなど）のisVisibleを同時に切り替える
        const nextRaw = rawSchedules.map(s => {
            const sId = Number(s.courseId || (s as any).id);
            return sId === targetCourseId ? {...s, isVisible: nextVisibility} : s;
        });

        // localStorageへの保存も含めて更新
        updateAll(nextRaw);

        // 2. サーバー同期
        if (user) {
            try {
                // PATCHリクエストを送信
                const res = await fetch('/api/user-courses/', {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        courseId: targetCourseId,
                        isVisible: nextVisibility
                    })
                });

                if (!res.ok) {
                    throw new Error("Failed to sync visibility");
                }
            } catch (e) {
                console.error("Visibility toggle sync failed", e);
                // 失敗した場合、ユーザーに知らせるか状態をロールバックする処理をここに追加可能
            }
        }
    };

    const updateMemo = async (course: FlatSchedule, nextMemo: string) => {
        const targetCourseId = Number(course.courseId || (course as any).id);

        // 1. ローカル状態の更新
        const nextRaw = rawSchedules.map(s => {
            const sId = Number(s.courseId || (s as any).id);
            return sId === targetCourseId ? {...s, memo: nextMemo} : s;
        });
        updateAll(nextRaw);

        // 2. サーバー同期
        if (user) {
            try {
                await fetch('/api/user-courses/', {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        courseId: targetCourseId,
                        memo: nextMemo
                    })
                });
            } catch (e) {
                console.error("Memo sync failed", e);
            }
        }
    };

    return {
        schedules: rawSchedules, // 全リスト（isVisible=falseも含む）
        displaySchedules,        // 描画用（isVisible=trueのみ）
        registeredIds,
        toggleCourse,
        toggleVisibility,
        updateMemo,
        isInitialized
    };
}