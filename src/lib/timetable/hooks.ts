import { useEffect, useMemo, useState } from 'react';
import type { FlatSchedule, UserCourseWithDetails, CourseFormInput } from "@/db/schema";
import { computeDisplaySchedules } from "@/lib/timetable/utils.ts";

export function useTimetable({
                                 initialCourses = [],
                                 user,
                                 selectedYear,
                                 selectedTerm
                             }: {
    initialCourses?: UserCourseWithDetails[],
    user: any,
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
                    setCourses(initialCourses);
                }
            }
        } else {
            setCourses(initialCourses);
        }
    }, [user, initialCourses]);

    // 全スケジュールを平坦化
    const allSchedules = useMemo(() => {
        return courses.flatMap(course =>
            course.schedules.map(s => {
                const { id: _unused, ...scheduleData } = s;
                return {
                    ...course,        // コース情報の展開
                    ...scheduleData,  // スケジュール情報の展開
                    id: course.id,    // コースID (string | number)
                    scheduleId: s.id,  // スケジュール自身のID
                    type: course.type // 'official' | 'custom'
                } as unknown as FlatSchedule;
            })
        );
    }, [courses]);

    // 選択中の年と学期の授業一覧
    const displayCourses = useMemo(() => {
        return courses.filter(uc => uc.year === selectedYear && uc.term === selectedTerm);
    }, [courses, selectedYear, selectedTerm]);

    // 描画用のデータ（isVisible=trueかつ選択中の年と学期のみ）
    const displaySchedules = useMemo(() => {
        const visibleOnly = allSchedules
            .filter(uc => uc.year === selectedYear && uc.term === selectedTerm)
            .filter(s => s.isVisible !== false);
        return computeDisplaySchedules(visibleOnly);
    }, [allSchedules, selectedYear, selectedTerm]);

    // 登録済み判定用：IDとTypeの組み合わせでSetを作る
    const registeredKeys = useMemo(() => {
        return new Set(courses.map(c => `${c.type}-${c.id}`));
    }, [courses]);

    const syncLocalStorage = (nextCourses: UserCourseWithDetails[]) => {
        if (user) return;
        localStorage.setItem('guest_timetable', JSON.stringify(nextCourses));
    };

    // --- ハンドラー ---
    // CustomCourseの保存（フォーム入力から）
    const saveCustomCourse = async (formData: CourseFormInput, mode: 'create' | 'edit') => {
        const isNew = mode === 'create';

        // IDの確定
        const tempId = isNew ? `custom-${Date.now()}` : formData.id;

        const newCourse: UserCourseWithDetails = {
            ...formData,
            id: tempId as any,
            type: 'custom',
            isVisible: true,
            year: selectedYear,
            term: selectedTerm as any,
            schedules: formData.schedules.map((s, idx) => ({ ...s, id: idx })),
        } as UserCourseWithDetails;

        // 更新または追加
        const nextCourses = !isNew
            ? courses.map(c => (c.type === 'custom' && String(c.id) === String(formData.id)) ? newCourse : c)
            : [...courses, newCourse];

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            try {
                const method = isNew ? 'POST' : 'PATCH';
                const response = await fetch('/api/custom-courses', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, id: isNew ? undefined : formData.id }),
                });

                if (isNew && response.ok) {
                    const data = (await response.json()) as { success: boolean; id: number };
                    if (data.id) {
                        setCourses(prev => prev.map(c => {
                            if (c.id === tempId) {
                                return { ...c, id: data.id } as UserCourseWithDetails;
                            }
                            return c;
                        }));
                    }
                }
            } catch (e) {
                console.error("Failed to save custom course", e);
            }
        }
    };

    // 削除・追加
    const toggleCourse = async (course: UserCourseWithDetails) => {
        const { id, type } = course;
        const courseKey = `${type}-${id}`;
        const isRegistered = registeredKeys.has(courseKey);

        let nextCourses: UserCourseWithDetails[];
        if (isRegistered) {
            nextCourses = courses.filter(c => `${c.type}-${c.id}` !== courseKey);
        } else {
            nextCourses = [...courses, { ...course, isVisible: true }];
        }

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            const endpoint = (type === 'custom') ? '/api/custom-courses' : '/api/user-courses';
            // 公式もカスタムも、登録済みなら削除リクエストを送る
            const method = isRegistered ? 'DELETE' : 'POST';

            await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, courseId: id }),
            });
        }
    };

    // 表示/非表示
    const toggleVisibility = async (course: UserCourseWithDetails) => {
        const { id, type, isVisible } = course;
        const nextVisible = !isVisible;

        const nextCourses = courses.map(c =>
            (c.id === id && c.type === type) ? { ...c, isVisible: nextVisible } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            const endpoint = (type === 'custom') ? '/api/custom-courses' : '/api/user-courses';
            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, courseId: id, isVisible: nextVisible })
            });
        }
    };

    // 色の更新
    const updateColor = async (course: UserCourseWithDetails, nextColor: string | null) => {
        const { id, type } = course;
        const nextCourses = courses.map(c =>
            (c.id === id && c.type === type) ? { ...c, colorCustom: nextColor } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            const endpoint = (type === 'custom') ? '/api/custom-courses' : '/api/user-courses';
            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, courseId: id, colorCustom: nextColor })
            });
        }
    };

    // メモの更新
    const updateMemo = async (course: UserCourseWithDetails, nextMemo: string) => {
        const { id, type } = course;
        const nextCourses = courses.map(c =>
            (c.id === id && c.type === type) ? { ...c, memo: nextMemo } : c
        );

        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            const endpoint = (type === 'custom') ? '/api/custom-courses' : '/api/user-courses';
            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, courseId: id, memo: nextMemo })
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