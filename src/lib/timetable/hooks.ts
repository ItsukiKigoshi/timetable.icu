import {useEffect, useMemo, useState} from 'react';
import type {FlatSchedule, UserCourseWithDetails} from "@/db/schema";
import {computeDisplaySchedules} from "@/lib/timetable/utils.ts";

export function useTimetable({
                                 initialCourses = [], // Astroから渡された UserCourseWithDetails[]
                                 user,
                                 selectedYear,
                                 selectedTerm
                             }: {
    initialCourses?: UserCourseWithDetails[],
    user: any
    selectedYear: number,
    selectedTerm: string,
}) {
    // Source of Truth (詳細データを含むコース配列すべてのデータはcoursesを参照すべし)
    const [courses, setCourses] = useState<UserCourseWithDetails[]>(initialCourses);

    // 初回マウント: LocalStorage(ゲスト) or Props(ログイン) から復元
    useEffect(() => {
        if (!user) {
            const cached = localStorage.getItem('guest_timetable');
            if (cached) {
                try {
                    setCourses(JSON.parse(cached));
                } catch (e) {
                    console.error("Failed to parse local timetable", e);
                    setCourses(initialCourses);
                }
            }
        } else {
            setCourses(initialCourses);
        }
    }, [user, initialCourses]);

    // 全スケジュールを平坦化 (全コマ)
    const allSchedules = useMemo(() => {
        return courses.flatMap(course =>
                course.schedules.map(s => ({
                    ...course,
                    ...s,
                    scheduleId: s.id,
                    id: course.id
                } as FlatSchedule))
            );
    }, [courses]);

    // 選択中の年と学期の授業一覧
    const displayCourses = useMemo(() => {
        return courses
            .filter(uc => uc.year === selectedYear && uc.term === selectedTerm)
    }, [courses]);

    // 描画用のデータ (isVisible=trueかつ選択中の年と学期のみ、かつ位置計算済み)
    const displaySchedules = useMemo(() => {
        const visibleOnly = allSchedules
            .filter(uc => uc.year === selectedYear && uc.term === selectedTerm)
            .filter(s => s.isVisible !== false);
        return computeDisplaySchedules(visibleOnly);
    }, [allSchedules]);

    // 登録済みIDのSet（ボタンの表示判定用）
    const registeredIds = useMemo(() => {
        return new Set(courses.map(c => c.id));
    }, [courses]);

    // ヘルパー: ローカルストレージ同期
    const syncLocalStorage = (nextCourses: UserCourseWithDetails[]) => {
        if (user) return;
        localStorage.setItem('guest_timetable', JSON.stringify(nextCourses));
    };

    // --- ハンドラー ---
    // 削除・追加 (Timetable画面では基本的に「削除」がメイン)
    const toggleCourse = async (course: UserCourseWithDetails) => {
        const targetCourseId = course.id;
        const isRegistered = registeredIds.has(targetCourseId);

        // 状態更新 (削除なら消す、追加なら入れる)
        const nextCourses = isRegistered
            ? courses.filter(c => c.id !== targetCourseId)
            : [...courses, { ...course, isVisible: true }];

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            try {
                await fetch('/api/user-courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId: targetCourseId }),
                });
                // 失敗時のロールバック処理を入れる場合はここに追加
            } catch (e) {
                console.error("Sync failed", e);
            }
        }
    };

    // 表示/非表示の切り替え
    const toggleVisibility = async (courseId: number) => {
        const target = courses.find(c => c.id === courseId);
        if (!target) return;

        const nextVisible = !target.isVisible;
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, isVisible: nextVisible } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            await fetch('/api/user-courses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, isVisible: nextVisible })
            });
        }
    };

    // 色の更新
    const updateColor = async (courseId: number, nextColor: string | null) => {
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, colorCustom: nextColor } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            await fetch('/api/user-courses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, colorCustom: nextColor })
            });
        }
    };

    // メモの更新
    const updateMemo = async (courseId: number, nextMemo: string) => {
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, memo: nextMemo } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            await fetch('/api/user-courses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, memo: nextMemo })
            });
        }
    };

    return {
        courses,
        schedules: allSchedules,
        displayCourses,
        displaySchedules,
        toggleCourse,
        toggleVisibility,
        updateColor,
        updateMemo,
    };
}