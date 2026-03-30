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

interface SearchResponse {
    results: CourseWithSchedules[];
    hasNextPage: boolean; // totalCount から変更
}

interface Props {
    initialResults: CourseWithSchedules[];
    initialFilters: SearchFilters;
    isLoggedIn: boolean;
    categories: Categories[];
    initialUserCourseIds: number[];
    user?: any;
    hasNextPage: boolean;
}

export default function ExploreInterface({
                                             initialResults,
                                             initialFilters: initialFilters,
                                             categories,
                                             initialUserCourseIds,
                                             user,
                                             hasNextPage: initialHasNext
                                         }: Props) {
    // 1. 状態管理
    const [courses, setCourses] = useState<CourseWithSchedules[]>(initialResults);
    const [hasNextPage, setHasNextPage] = useState(initialHasNext);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    const {registeredIds, toggleCourse, isInitialized} = useTimetable({
        initialCourseIds: initialUserCourseIds,
        user
    });

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
            setHasNextPage(data.hasNextPage);
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

    return (
        <div className="space-y-6">
            {/* フィルターセクション */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <label
                    className="input input-bordered flex items-center gap-2 w-full max-w-xs shadow-sm bg-base-100/50 backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 22H5.5a1 1 0 0 1 0-5h4.501"/>
                        <path d="m21 22-1.879-1.878"/>
                        <path d="M3 19.5v-15A2.5 2.5 0 0 1 5.5 2H18a1 1 0 0 1 1 1v8"/>
                        <circle cx="17" cy="18" r="3"/>
                    </svg>
                    <input
                        type="text"
                        className="grow"
                        placeholder="タイトル、教員名..."
                        defaultValue={filters.q || ''}
                        onKeyDown={(e) => e.key === 'Enter' && update({q: e.currentTarget.value})}
                    />
                </label>

                <label
                    className="input input-bordered flex items-center gap-2 w-full max-w-xs bg-base-100/50 backdrop-blur-md shadow-sm group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         className="lucide lucide-list-filter-icon lucide-list-filter">
                        <path d="M2 5h20"/>
                        <path d="M6 12h12"/>
                        <path d="M9 19h6"/>
                    </svg>
                    <select
                        className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none"
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
                </label>

                <button
                    type="button"
                    className="btn btn-md flex items-center gap-2 w-fi max-w-xs bg-base-100/50 backdrop-blur-md shadow-sm border-white/20 font-normal text-base-content"
                    onClick={() => (window as any).slot_modal.showModal()}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24" height="24"
                        viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 2v4"/>
                        <path d="M21 11.75V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.25"/>
                        <path d="m22 22-1.875-1.875"/>
                        <path d="M3 10h18"/>
                        <path d="M8 2v4"/>
                        <circle cx="18" cy="18" r="3"/>
                    </svg>

                    <span className="grow text-left">
                    時限を選択
                        <span
                            className={`ml-2 text-xs ${(filters.slots?.length ?? 0) > 0 ? 'font-bold' : 'opacity-50'}`}>
                            ({filters.slots?.length ?? 0})
                        </span>
                    </span>
                </button>
            </div>

            {/* 時限モーダル */}
            <dialog id="slot_modal" className="modal modal-bottom">
                <div
                    className="modal-box p-0 overflow-hidden bg-base-100/95 border border-white/10 shadow-2xl sm:max-w-2xl md:max-w-3xl mx-auto">
                    <div className="p-4 sm:p-6">
                        <div className="overflow-x-auto rounded-xl border border-base-300 shadow-sm bg-base-100">
                            <table className="table table-fixed w-full text-center">
                                <thead>
                                <tr className="bg-base-200/50">
                                    <th className="w-12 bg-base-200/80"></th>
                                    {SELECTABLE_DAYS.map(d => <th key={d} className="font-bold">{d}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {[1, 2, 3, 4, 5, 6, 7].map(p => (
                                    <tr key={p}>
                                        <th className="bg-base-200/80 font-bold">{p}</th>
                                        {SELECTABLE_DAYS.map(day => {
                                            const isSelected = filters.slots?.includes(`${day}-${p}`);
                                            return (
                                                <td
                                                    key={`${day}-${p}`}
                                                    className={`cursor-pointer border border-base-300 h-14 transition-all ${
                                                        isSelected ? 'bg-primary text-primary-content' : 'hover:bg-primary/10'
                                                    }`}
                                                    onClick={() => toggleSlot(day, p)}
                                                >
                                                    {isSelected && (
                                                        <span className="flex justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline
                                                        points="20 6 9 17 4 12"/></svg>
                                                </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-action flex justify-between items-center mt-6">
                            <button
                                className="btn btn-ghost btn-sm text-error"
                                onClick={() => update({slots: []})}
                            >
                                選択をクリア
                            </button>
                            <form method="dialog">
                                <button className="btn btn-outline border-base-100/40 px-10 shadow-lg">
                                    閉じる
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* 背景（オーバーレイ） */}
                <form method="dialog" className="modal-backdrop ">
                    <button>close</button>
                </form>
            </dialog>


            {/* ページネーション上 */}
            <div className="flex flex-col items-center gap-4">
                <div className="join">
                    <button
                        className="join-item btn"
                        disabled={filters.page <= 1}
                        onClick={() => update({page: filters.page - 1})}
                    >
                        «
                    </button>
                    <button className="join-item btn no-animation">
                        Page {filters.page}
                    </button>
                    <button
                        className="join-item btn"
                        disabled={!hasNextPage} // 次のページがあるかどうかで判定
                        onClick={() => update({page: filters.page + 1})}
                    >
                        »
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
                                       )}`} className="btn btn-sm">
                                        <span>シラバス</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                             stroke-linecap="round" stroke-linejoin="round"
                                             className="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right">
                                            <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>
                                            <path d="m21 3-9 9"/>
                                            <path d="M15 3h6v6"/>
                                        </svg>
                                    </a>
                                    {(hasSchedules || isAdded) && (
                                        <button
                                            onClick={() => handleToggle(course)}
                                            disabled={loading}
                                            className={`btn btn-sm gap-1 transition-all duration-300 ${
                                                isAdded
                                                    ? 'btn-error btn-outline'
                                                    : 'btn-primary'
                                            }`}
                                        >
                                            {loading ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : isAdded ? (
                                                <>
                                                    <span>削除</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                    >
                                                        <path d="M18 6 6 18"/>
                                                        <path d="m6 6 12 12"/>
                                                    </svg>
                                                </>
                                            ) : (
                                                <>
                                                    <span>追加</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         stroke-width="2" stroke-linecap="round"
                                                         stroke-linejoin="round">
                                                        <path d="M12 7v6"/>
                                                        <path d="M15 10H9"/>
                                                        <path
                                                            d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>
                                                    </svg>
                                                </>
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

            {/* ページネーション下 */}
            <div className="flex flex-col items-center gap-4 py-6 mb-6">
                <div className="join">
                    <button
                        className="join-item btn"
                        disabled={filters.page <= 1}
                        onClick={() => update({page: filters.page - 1})}
                    >
                        «
                    </button>
                    <button className="join-item btn no-animation">
                        Page {filters.page}
                    </button>
                    <button
                        className="join-item btn"
                        disabled={!hasNextPage} // 次のページがあるかどうかで判定
                        onClick={() => update({page: filters.page + 1})}
                    >
                        »
                    </button>
                </div>
            </div>
        </div>
    );
}