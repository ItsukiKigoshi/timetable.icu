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
    // CustomCourseの保存
    const saveCustomCourse = async (formData: any) => {
        // 1. IDの生成 (ゲストなら一時的なID、ログインならDB発行のIDを想定)
        // 既存の数値IDと衝突しないよう "custom-" プレフィックスを維持
        const isNew = !formData.id;
        const tempId = formData.id || `custom-${Date.now()}`;

        const newCourse: UserCourseWithDetails = {
            ...formData,
            id: tempId,
            isVisible: true,
            year: selectedYear,
            term: selectedTerm,
            // formData.schedules は既に {dayOfWeek, period, startTime, endTime} を持っている前提
        };

        // 2. 状態更新
        const nextCourses = !isNew
            ? courses.map(c => c.id === formData.id ? newCourse : c) // 編集
            : [...courses, newCourse]; // 新規

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        // 3. ログイン済みならDBへ
        if (user) {
            try {
                const method = isNew ? 'POST' : 'PATCH';
                const response = await fetch('/api/custom-courses', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCourse),
                });

                if (isNew && response.ok) {
                    // response.json() の結果に型を付ける
                    const data = (await response.json()) as { success: boolean; id: number };

                    // DBで確定した数値IDに差し替える (オプションだが推奨)
                    // tempId (custom-xxx) を DB発行の数値ID に置き換えることで、以降の PATCH が正しく動作する
                    if (data.id) {
                        setCourses(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id } : c));
                    }
                }
            } catch (e) {
                console.error("Failed to save custom course", e);
            }
        }
    };

    // 削除・追加 (Timetable画面では基本的に「削除」がメイン)
    const toggleCourse = async (course: UserCourseWithDetails) => {
        const targetCourseId = course.id;
        const isRegistered = registeredIds.has(targetCourseId);
        const isCustom = typeof targetCourseId === 'string' || targetCourseId > 100000; // カスタムかどうかの判定

        // 状態更新 (削除なら消す、追加なら入れる)
        const nextCourses = isRegistered
            ? courses.filter(c => c.id !== targetCourseId)
            : [...courses, { ...course, isVisible: true }];

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            try {
                // カスタムコースの場合は専用APIのDELETE、通常コースはuser-coursesのPOST(Toggle)
                const endpoint = isCustom ? '/api/custom-courses' : '/api/user-courses';
                const method = isCustom ? 'DELETE' : 'POST';

                await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: targetCourseId, courseId: targetCourseId }),
                });
            } catch (e) {
                console.error("Sync failed", e);
            }
        }
    };

    // 表示/非表示の切り替え
    const toggleVisibility = async (courseId: number | string) => {
        const target = courses.find(c => c.id === courseId);
        if (!target) return;

        const nextVisible = !target.isVisible;
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, isVisible: nextVisible } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            // IDが文字列（custom-xxx）ならカスタムコース用APIを叩く
            const isCustom = typeof courseId === 'string';
            const endpoint = isCustom ? '/api/custom-courses' : '/api/user-courses';

            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: courseId,       // custom-course API用
                    courseId: courseId, // user-course API用
                    isVisible: nextVisible
                })
            });
        }
    };

    // 色の更新
    const updateColor = async (courseId: number | string, nextColor: string | null) => {
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, colorCustom: nextColor } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            const isCustom = typeof courseId === 'string';
            const endpoint = isCustom ? '/api/custom-courses' : '/api/user-courses';

            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: courseId,
                    courseId: courseId,
                    colorCustom: nextColor
                })
            });
        }
    };

    // メモの更新
    const updateMemo = async (courseId: number | string, nextMemo: string) => {
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, memo: nextMemo } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            const isCustom = typeof courseId === 'string';
            const endpoint = isCustom ? '/api/custom-courses' : '/api/user-courses';

            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: courseId,
                    courseId: courseId,
                    memo: nextMemo
                })
            });
        }
    };

    return {
        courses,
        schedules: allSchedules,
        displayCourses,
        displaySchedules,
        saveCustomCourse,
        toggleCourse,
        toggleVisibility,
        updateColor,
        updateMemo,
    };
}