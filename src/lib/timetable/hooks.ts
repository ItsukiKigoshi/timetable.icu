import {useEffect, useMemo, useState} from 'react';
import type {AnyCourseWithDetails, CourseFormInput, FlatSchedule, UserCourseWithDetails} from "@/db/schema";
import {computeDisplaySchedules} from "@/lib/timetable/utils.ts";

export function useTimetable({
                                 initialCourses = [], // Astroから渡された UserCourseWithDetails[]
                                 user,
                                 selectedYear,
                                 selectedTerm
                             }: {
    initialCourses?: AnyCourseWithDetails[],
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
            course.schedules.map(s => {
                const { id: _unused, ...scheduleData } = s;

                return {
                    ...course,
                    ...scheduleData,
                    scheduleId: s.id,
                    id: course.id
                } as FlatSchedule;
            })
        );
    }, [courses]);

    // 選択中の年と学期の授業一覧
    const displayCourses = useMemo(() => {
        return courses
            .filter(uc => uc.year === selectedYear && uc.term === selectedTerm)
    }, [courses, selectedYear, selectedTerm]);

    // 描画用のデータ (isVisible=trueかつ選択中の年と学期のみ、かつ位置計算済み)
    const displaySchedules = useMemo(() => {
        const visibleOnly = allSchedules
            .filter(uc => uc.year === selectedYear && uc.term === selectedTerm)
            .filter(s => s.isVisible !== false);
        return computeDisplaySchedules(visibleOnly);
    }, [allSchedules, selectedYear, selectedTerm]);

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
    const saveCustomCourse = async (formData: CourseFormInput) => {
        const isNew = !formData.id;
        const tempId = formData.id || `custom-${Date.now()}`;

        // DB構造に合わせたオブジェクト作成
        const newCourse: any = {
            ...formData,
            id: tempId,
            // カスタム科目としての最小要件を満たす
            title: formData.title,
            isVisible: true,
            year: selectedYear,
            term: selectedTerm,
        };
        const nextCourses = !isNew
            ? courses.map(c => String(c.id) === String(formData.id) ? newCourse : c)
            : [...courses, newCourse];

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        // ログイン済みならDBへ
        if (user) {
            try {
                const method = isNew ? 'POST' : 'PATCH';
                const response = await fetch('/api/custom-courses', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCourse),
                });

                if (isNew && response.ok) {
                    const data = (await response.json()) as { success: boolean; id: number };
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
    const toggleCourse = async (course: AnyCourseWithDetails) => {
        const targetCourseId = course.id;
        const isRegistered = registeredIds.has(targetCourseId);

        // idの型によってカスタムかどうかを確実に判定
        const isCustom = typeof targetCourseId === 'string';

        let nextCourses: AnyCourseWithDetails[];

        if (isRegistered) {
            nextCourses = courses.filter(c => c.id !== targetCourseId);
        } else {
            // ここで型アサーション(as any)を使わずに安全にコピー
            const courseWithContext = {
                ...course,
                year: course.year || selectedYear,
                term: course.term || selectedTerm,
                isVisible: true
            } as AnyCourseWithDetails; // 合成された型として扱う

            nextCourses = [...courses, courseWithContext];
        }

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            try {
                const endpoint = isCustom ? '/api/custom-courses' : '/api/user-courses';
                const method = isCustom ? 'DELETE' : 'POST';

                await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: targetCourseId,
                        courseId: targetCourseId,
                        year: selectedYear,
                        term: selectedTerm
                    }),
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
            const isCustom = typeof courseId === 'string';
            const endpoint = isCustom ? '/api/custom-courses' : '/api/user-courses';

            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: courseId,
                    courseId: courseId,
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