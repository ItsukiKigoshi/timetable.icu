import React, {useState} from 'react';
import type {Categories, CourseWithSchedules} from "@/db/schema";
import {useTimetable} from "@/lib/useTimetable";
import {SELECTABLE_DAYS} from "@/constants/time.ts";
import {seasonToNumber} from "@/components/TimetableInterface.tsx";

export interface SearchFilters {
    year: string | null;
    term: string | null;
    day: string | null;
    period: string | null;
    isLong: string | null;
    categoryId: string | null;
    q: string | null;
    slots: string[] | null;
    page: number;
}

interface Props {
    initialResults: CourseWithSchedules[];
    filters: SearchFilters;
    isLoggedIn: boolean;
    categories: Categories[];
    initialUserCourseIds: number[];
    user?: any;
    totalCount: number;
}

export default function ExploreInterface({
                                             initialResults,
                                             filters: initialFilters,
                                             categories,
                                             initialUserCourseIds,
                                             user,
                                             totalCount: initialTotal
                                         }: Props) {
    // 1. 状態管理
    const [courses, setCourses] = useState<CourseWithSchedules[]>(initialResults);
    const [totalCount, setTotalCount] = useState(initialTotal);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    const {registeredIds, toggleCourse, isInitialized} = useTimetable({
        initialCourseIds: initialUserCourseIds,
        user
    });

    interface SearchResponse {
        results: CourseWithSchedules[];
        totalCount: number;
    }

    // 2. APIフェッチ関数
    const fetchData = async (nextFilters: SearchFilters) => {
        setIsFetching(true);
        try {
            const params = new URLSearchParams();
            Object.entries(nextFilters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) params.set(key, value.join(','));
                } else if (value) {
                    params.set(key, value.toString());
                }
            });

            const res = await fetch(`/api/courses?${params.toString()}`);
            const data = (await res.json()) as SearchResponse;

            setCourses(data.results);
            setTotalCount(data.totalCount);
        } catch (e) {
            console.error("Failed to fetch courses:", e);
        } finally {
            setIsFetching(false);
        }
    };

    // 3. 検索条件の更新（URLのみ更新 & データ取得）
    const update = (newParams: Partial<SearchFilters>) => {
        // 新しいフィルタ状態を作成
        const nextFilters = {...filters, ...newParams};

        // ページ番号の調整（検索条件が変わったら1ページ目へ）
        if (newParams.page === undefined) {
            nextFilters.page = 1;
        } else {
            nextFilters.page = Number(newParams.page);
        }

        window.scrollTo({top: 0, behavior: 'smooth'});

        // URLパラメータの同期（見た目上のURLを書き換え）
        const url = new URL(window.location.href);
        Object.entries(nextFilters).forEach(([key, value]) => {
            if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value.toString());
            }
        });
        window.history.pushState({}, '', url);

        // 状態更新とデータ取得
        setFilters(nextFilters);
        fetchData(nextFilters);
    };


    const handleToggle = async (course: CourseWithSchedules) => {
        if (isSubmitting === course.id) return;
        setIsSubmitting(course.id);
        try {
            await toggleCourse(course);
        } finally {
            setIsSubmitting(null);
        }
    };

    const toggleSlot = (day: string, period: number) => {
        const slotStr = `${day}-${period}`;
        const currentSlots = filters.slots || [];
        const newSlots = currentSlots.includes(slotStr)
            ? currentSlots.filter(s => s !== slotStr)
            : [...currentSlots, slotStr];

        update({slots: newSlots});
    };

    const majorCategories = categories.filter(c => c.id?.startsWith('M') && (c.id !== "MSTH"));
    const otherCategories = categories.filter(c => !(c.id?.startsWith('M') && (c.id !== "MSTH")));
    const totalPages = Math.ceil(totalCount / 20);

    return (
        <div className="space-y-6">
            {/* フィルターセクション */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <input
                    type="text"
                    className="input input-bordered w-full max-w-xs"
                    placeholder="タイトル、教員名..."
                    defaultValue={filters.q || ''}
                    onKeyDown={(e) => e.key === 'Enter' && update({q: e.currentTarget.value})}
                />

                <select
                    className="select select-bordered w-full max-w-xs"
                    value={filters.categoryId || ''}
                    onChange={(e) => update({categoryId: e.target.value})}
                >
                    <option value="">全てのカテゴリ / メジャー</option>
                    <optgroup label="メジャー (Majors)">
                        {majorCategories.map(c => <option key={c.id} value={c.id}>{c.nameJa}</option>)}
                    </optgroup>
                    <optgroup label="一般カテゴリ / その他">
                        {otherCategories.map(c => <option key={c.id} value={c.id}>{c.nameJa}</option>)}
                    </optgroup>
                </select>

                <button
                    className={`btn ${filters.slots?.length ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => (window as any).slot_modal.showModal()}
                >
                    時限 ({filters.slots?.length || 0})
                </button>
            </div>

            {/* 時限モーダル */}
            <dialog id="slot_modal" className="modal modal-bottom">
                <div className="modal-box p-0 overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-base-200">
                        <h3 className="font-bold text-lg">時限を選択</h3>
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost">✕</button>
                        </form>
                    </div>
                    <div className="p-4">
                        <div className="overflow-x-auto">
                            <table className="table table-fixed w-full border border-base-300 text-center">
                                <thead>
                                <tr className="bg-base-200">
                                    <th className="w-10"></th>
                                    {SELECTABLE_DAYS.map(d => <th key={d}>{d}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {[1, 2, 3, 4, 5, 6, 7].map(p => (
                                    <tr key={p}>
                                        <th className="bg-base-200">{p}</th>
                                        {SELECTABLE_DAYS.map(day => {
                                            const isSelected = filters.slots?.includes(`${day}-${p}`);
                                            return (
                                                <td
                                                    key={`${day}-${p}`}
                                                    className={`cursor-pointer border border-base-300 h-12 ${isSelected ? 'bg-primary/30' : 'hover:bg-base-200'}`}
                                                    onClick={() => toggleSlot(day, p)}
                                                >
                                                    {isSelected && "✓"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-action flex justify-between">
                            <button className="btn btn-ghost btn-sm text-error"
                                    onClick={() => update({slots: []})}>クリア
                            </button>
                            <form method="dialog">
                                <button className="btn btn-primary">閉じる</button>
                            </form>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <div className="flex flex-col items-center gap-4">
                <div className="join">
                    <button className="join-item btn" disabled={filters.page <= 1}
                            onClick={() => update({page: filters.page - 1})}>«
                    </button>
                    <button className="join-item btn no-animation">Page {filters.page} / {totalPages}</button>
                    <button className="join-item btn" disabled={filters.page >= totalPages}
                            onClick={() => update({page: filters.page + 1})}>»
                    </button>
                </div>
            </div>
            {/* 結果表示セクション */}
            <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                {courses.map((course) => {
                    const isAdded = registeredIds.has(course.id);
                    const hasSchedules = course.schedules && course.schedules.length > 0;
                    // 1. API送信中 2. 初期化(localStorage読み込み)中 のどちらかであればローディング
                    const loading = isSubmitting === course.id || !isInitialized;
                    return (
                        <div key={course.id} className="card bg-base-100 shadow-sm border border-base-200">
                            <div className="card-body p-4">
                                <div className="flex justify-between items-center w-full">
                                     <span className="text-xs text-base-content/50 font-mono">
                                        {course.courseCode}
                                    </span>
                                    <span className="text-xs text-base-content/50">
                                        {course.year} {course.term}
                                    </span>
                                </div>

                                <h2 className="card-title text-base mt-2 line-clamp-2">{course.titleJa}</h2>
                                <p className="text-sm text-base-content/70">{course.instructor}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {hasSchedules ? (
                                        course.schedules.map((s, i) => (
                                            <span key={i} className="badge badge-ghost badge-sm font-mono uppercase">
                                                {s.dayOfWeek.slice(0, 2)}{s.period}{s.isLong ? "*" : ""}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs">No Schedule</span>
                                    )}
                                </div>

                                <div className="card-actions flex justify-between mt-4">
                                    {/* 「スケジュールがある」または「すでに登録されている（削除用）」場合のみボタンを表示。
                                      スケジュールがなく、かつ登録もされていない授業は、ボタンが非表示になります。
                                    */}
                                    <a target='_blank'
                                       href={`https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?regno=${
                                           course.rgNo
                                       }&year=${course.year}&term=${seasonToNumber(
                                           course.term
                                       )}`} className="btn btn-sm">シラバス</a>
                                    {(hasSchedules || isAdded) && (
                                        <button
                                            onClick={() => handleToggle(course)}
                                            disabled={loading}
                                            className={`btn btn-sm ${isAdded ? 'btn-error' : 'btn-primary'}`}
                                        >
                                            {loading ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                isAdded ? '削除' : '追加'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {courses.length === 0 && (
                    <div>
                        該当する授業が見つかりませんでした。
                    </div>
                )}
            </div>

            {/* ページネーション */}
            <div className="flex flex-col items-center gap-4 py-6 mb-6">
                <div className="join">
                    <button className="join-item btn" disabled={filters.page <= 1}
                            onClick={() => update({page: filters.page - 1})}>«
                    </button>
                    <button className="join-item btn no-animation">Page {filters.page} / {totalPages}</button>
                    <button className="join-item btn" disabled={filters.page >= totalPages}
                            onClick={() => update({page: filters.page + 1})}>»
                    </button>
                </div>
                <div className="text-xs text-base-content/50">Total: {totalCount} items</div>
            </div>
        </div>
    );
}