import {useEffect, useMemo, useState} from 'react';
import type {FlatSchedule, UserCourseWithDetails} from "@/db/schema";
import {computeDisplaySchedules} from "@/lib/timetable/utils.ts";
import type {UserCoursePostResponse} from "@/pages/api/user-courses";

export function useTimetable({
                                 initialCourses = [], // Astroから渡された UserCourseWithDetails[]
                                 initialCourseIds = [], // CourseのIDのみの初期値も受け取れるようにする（explore用）
                                 user
                             }: {
    initialCourses?: UserCourseWithDetails[],
    initialCourseIds?: number[],
    user: any
}) {
    // コース単位で管理する (Source of Truth)
    const [courses, setCourses] = useState<UserCourseWithDetails[]>(initialCourses);
    // 初期化状態を管理するステート
    const [isInitialized, setIsInitialized] = useState(false);

    // 初回マウント: LocalStorage or ServerProps から復元
    useEffect(() => {
        const loadInitialData = () => {
            if (!user) {
                // ゲスト：LocalStorage最優先
                const cached = localStorage.getItem('guest_timetable');
                if (cached) {
                    setCourses(JSON.parse(cached));
                } else {
                    setCourses(initialCourses);
                }
            } else {
                // ログイン
                setCourses(initialCourses);
            }
            setIsInitialized(true);
        };

        loadInitialData();
    }, [user, initialCourses]);

    // 登録済みIDのSet
    // initialCourseIds（検索画面用）と courses（時間割画面用）の両方を合算する
    const registeredIds = useMemo(() => {
        const idsFromCourses = courses.map(c => c.id);
        return new Set([...initialCourseIds, ...idsFromCourses]);
    }, [courses, initialCourseIds]);

    // 4. 全てのスケジュールを平坦化 (isVisibleに関わらず全てのコマ)
    const allSchedules = useMemo(() => {
        return courses.flatMap(course =>
            course.schedules.map(s => ({
                ...course,
                ...s,
                scheduleId: s.id,
                id: course.id // コースIDを保持
            } as FlatSchedule))
        );
    }, [courses]);

    // 描画用のデータ (isVisible=true のみ、かつ位置計算済み)
    const displaySchedules = useMemo(() => {
        const visibleOnly = allSchedules.filter(s => s.isVisible !== false);
        return computeDisplaySchedules(visibleOnly);
    }, [allSchedules]);

    // ローカルストレージ保存用ヘルパー
    const syncLocalStorage = (nextCourses: UserCourseWithDetails[]) => {
        if (user) return;
        localStorage.setItem('guest_timetable', JSON.stringify(nextCourses));
    };

    // --- ハンドラー ---
    // TODO - Exploreでも使用するので別の場所にあった方が良い？
    const toggleCourse = async (course: any) => {
        // 引数の course が「IDだけ」の場合と「オブジェクト」の場合の両方に対応させる
        const targetCourseId = Number(course.id || course.courseId);
        const isRegistered = registeredIds.has(targetCourseId);

        if (user) {
            // ログイン済み - サーバーと同期
            try {
                const res = await fetch('/api/user-courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId: targetCourseId }),
                });
                const data = (await res.json()) as UserCoursePostResponse;

                if ("error" in data) return;

                if (data.action === "added") {
                    // Explore画面で使う場合、course に詳細が入っていればそれを追加し、
                    // なければ最低限のIDを持つオブジェクトを入れる（または再取得を検討する）
                    setCourses(prev => [...prev, { ...course, isVisible: true }]);
                } else {
                    setCourses(prev => prev.filter(c => c.id !== targetCourseId));
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            // --- ゲストモード: ローカルのみ ---
            if (isRegistered) {
                const next = courses.filter(c => c.id !== targetCourseId);
                setCourses(next);
                syncLocalStorage(next);
            } else {
                const next = [...courses, { ...course, isVisible: true }];
                setCourses(next);
                syncLocalStorage(next);
            }
        }
    };

    const toggleVisibility = async (courseId: number) => {
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, isVisible: !c.isVisible } : c
        );
        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            await fetch('/api/user-courses/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, isVisible: nextCourses.find(c => c.id === courseId)?.isVisible })
            });
        }
    };

    const updateMemo = async (courseId: number, nextMemo: string) => {
        const nextCourses = courses.map(c =>
            c.id === courseId ? { ...c, memo: nextMemo } : c
        );
        setCourses(nextCourses);
        syncLocalStorage(nextCourses);

        if (user) {
            await fetch('/api/user-courses/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, memo: nextMemo })
            });
        }
    };


    return {
        courses,             // コース一覧
        schedules: allSchedules, // 平坦化リスト
        displaySchedules,    // 描画用リスト
        isInitialized, // 描画の初期化が終わったかどうか
        registeredIds,
        toggleCourse,
        toggleVisibility,
        updateMemo,
    };
}