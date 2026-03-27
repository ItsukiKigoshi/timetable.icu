import React, { useState } from 'react';
import type { Categories, CourseWithSchedules } from "@/db/schema";
import { useTimetable } from "@/lib/useTimetable";

export interface SearchFilters {
    year: string | null;
    term: string | null;
    day: string | null;
    period: string | null;
    isLong: string | null;
    categoryId: string | null;
    q: string | null;
    page: number;
}

interface Props {
    initialResults: CourseWithSchedules[];
    filters: SearchFilters;
    isLoggedIn: boolean;
    categories: Categories[];
    initialUserCourseIds: number[]; // ログイン済みの場合の初期登録済みリスト
    user?: any; // Astro.locals.user から渡される
}

export default function SearchInterface({
                                            initialResults,
                                            filters,
                                            isLoggedIn,
                                            categories,
                                            initialUserCourseIds,
                                            user
                                        }: Props) {
    // 時間割管理フックを呼び出す
    // 初期値として「登録済みID」を反映させるため、空の ProcessedSchedule 配列を渡す（検索画面では描画しないため）
    const { schedules, toggleCourse } = useTimetable({
        processedSchedules: [], // 検索画面自体の描画には不要なので空でOK
        user
    });

    // 登録済みかどうかを判定するためのIDセット
    // ログイン時は initialUserCourseIds、未ログイン時はフック内の schedules から算出
    const registeredIds = isLoggedIn
        ? new Set([...initialUserCourseIds, ...schedules.map(s => s.courseId)])
        : new Set(schedules.map(s => s.courseId));

    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    const handleToggle = async (course: CourseWithSchedules) => {
        setIsSubmitting(course.id);
        await toggleCourse(course); // フック側のロジック（API呼び出し or localStorage）を実行
        setIsSubmitting(null);
    };

    const update = (params: Partial<Record<keyof SearchFilters | 'category', string | null>>) => {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([k, v]) => {
            const key = k === 'categoryId' ? 'category' : k;
            if (v) url.searchParams.set(key, v);
            else url.searchParams.delete(key);
        });

        if (!params.hasOwnProperty('page')) url.searchParams.delete('page');
        window.location.assign(url.toString());
    };

    const majorCategories = categories.filter(c => c.id?.startsWith('M') && (c.id !== "MSTH"));
    const otherCategories = categories.filter(c => !(c.id?.startsWith('M') && (c.id !== "MSTH")));

    return (
        <div className="space-y-4">
            {/* フィルターセクション */}
            <section className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
                <select className="border p-1 rounded" value={filters.year || ''} onChange={(e) => update({ year: e.target.value })}>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                </select>

                <select className="border p-1 rounded" value={filters.term || ''} onChange={(e) => update({ term: e.target.value })}>
                    <option value="Spring">春学期</option>
                    <option value="Autumn">秋学期</option>
                    <option value="Winter">冬学期</option>
                </select>

                <input
                    type="text"
                    className="border p-1 rounded flex-1 min-w-[200px]"
                    placeholder="タイトル、教員名..."
                    defaultValue={filters.q || ''}
                    onKeyDown={(e) => e.key === 'Enter' && update({ q: e.currentTarget.value })}
                />

                <select className="border p-1 rounded" value={filters.day || ''} onChange={(e) => update({ day: e.target.value })}>
                    <option value="">曜日</option>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select className="border p-1 rounded" value={filters.period || ''} onChange={(e) => update({ period: e.target.value })}>
                    <option value="">時限</option>
                    {[1, 2, 3, 4, 5, 6, 7].map(p => <option key={p} value={p.toString()}>{p}</option>)}
                </select>

                <select className="border p-1 rounded max-w-[150px]" value={filters.categoryId || ''} onChange={(e) => update({ categoryId: e.target.value })}>
                    <option value="">メジャー (全て)</option>
                    {majorCategories.map(c => <option key={c.id} value={c.id}>{c.nameJa}</option>)}
                </select>

                <select className="border p-1 rounded max-w-[150px]" value={filters.categoryId || ''} onChange={(e) => update({ categoryId: e.target.value })}>
                    <option value="">カテゴリ (全て)</option>
                    {otherCategories.map(c => <option key={c.id} value={c.id}>{c.nameJa}</option>)}
                </select>
            </section>

            {/* ページネーション */}
            <div className="flex items-center gap-4 justify-center">
                <button className="px-3 py-1 bg-white border rounded disabled:opacity-30" disabled={filters.page <= 1} onClick={() => update({ page: (filters.page - 1).toString() })}>＜</button>
                <span className="font-bold text-sm">Page {filters.page}</span>
                <button className="px-3 py-1 bg-white border rounded disabled:opacity-30" disabled={initialResults.length < 50} onClick={() => update({ page: (filters.page + 1).toString() })}>＞</button>
            </div>

            {/* 結果テーブル */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 border-b">Term</th>
                        <th className="p-3 border-b">Title</th>
                        <th className="p-3 border-b">Schedule</th>
                        <th className="p-3 border-b text-center">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {initialResults.map((course) => {
                        const isAdded = registeredIds.has(course.id);
                        return (
                            <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 border-b whitespace-nowrap">{course.term} {course.year}</td>
                                <td className="p-3 border-b font-medium">{course.titleJa}</td>
                                <td className="p-3 border-b">
                                    {course.schedules.map((s) => `${s.period}${s.isLong ? "*" : ""}/${s.dayOfWeek}`).join(', ')}
                                </td>
                                <td className="p-3 border-b text-center">
                                    <button
                                        onClick={() => handleToggle(course)}
                                        disabled={isSubmitting === course.id}
                                        className={`px-4 py-1 rounded text-xs font-bold transition-all ${
                                            isAdded
                                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } disabled:opacity-50`}
                                    >
                                        {isAdded ? '削除' : '追加'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}