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
    initialUserCourseIds: number[]; // SSRから渡される初期値
    user?: any;
}

export default function SearchInterface({
                                            initialResults,
                                            filters,
                                            categories,
                                            initialUserCourseIds,
                                            user
                                        }: Props) {
    // 1. カスタムフックの呼び出し
    // registeredIds: 実際に登録されているコースIDのSet
    // toggleCourse: APIまたはlocalStorageを操作する関数
    const { registeredIds, toggleCourse } = useTimetable({
        initialCourseIds: initialUserCourseIds,
        user
    });

    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    // 2. 追加・削除のハンドリング
    const handleToggle = async (course: CourseWithSchedules) => {
        if (isSubmitting === course.id) return;
        setIsSubmitting(course.id);
        try {
            await toggleCourse(course);
        } finally {
            setIsSubmitting(null);
        }
    };

    // 3. 検索条件の更新（URLクエリパラメータの操作）
    const update = (params: Partial<Record<keyof SearchFilters | 'category', string | null>>) => {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([k, v]) => {
            const key = k === 'categoryId' ? 'category' : k;
            if (v) url.searchParams.set(key, v);
            else url.searchParams.delete(key);
        });

        // 検索条件が変わったら1ページ目に戻す（明示的なpage指定がない場合）
        if (!params.hasOwnProperty('page')) url.searchParams.delete('page');
        window.location.assign(url.toString());
    };

    // カテゴリの分類
    const majorCategories = categories.filter(c => c.id?.startsWith('M') && (c.id !== "MSTH"));
    const otherCategories = categories.filter(c => !(c.id?.startsWith('M') && (c.id !== "MSTH")));

    return (
        <div>
            {/* フィルターセクション */}
            <section>
                <div>
                    <select value={filters.year || ''} onChange={(e) => update({ year: e.target.value })}>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                    </select>

                    <select value={filters.term || ''} onChange={(e) => update({ term: e.target.value })}>
                        <option value="Spring">春学期</option>
                        <option value="Autumn">秋学期</option>
                        <option value="Winter">冬学期</option>
                    </select>
                </div>

                <input
                    type="text"
                    placeholder="タイトル、教員名..."
                    defaultValue={filters.q || ''}
                    onKeyDown={(e) => e.key === 'Enter' && update({ q: e.currentTarget.value })}
                />

                <div>
                    <select value={filters.day || ''} onChange={(e) => update({ day: e.target.value })}>
                        <option value="">曜日</option>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select value={filters.period || ''} onChange={(e) => update({ period: e.target.value })}>
                        <option value="">時限</option>
                        {[1, 2, 3, 4, 5, 6, 7].map(p => <option key={p} value={p.toString()}>{p}</option>)}
                    </select>
                </div>

                <div>
                    <select
                        value={filters.categoryId || ''}
                        onChange={(e) => update({ categoryId: e.target.value })}
                    >
                        <option value="">全てのカテゴリ / メジャー</option>

                        {/* メジャーセクション */}
                        {majorCategories.length > 0 && (
                            <optgroup label="メジャー (Majors)">
                                {majorCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.nameJa}</option>
                                ))}
                            </optgroup>
                        )}

                        {/* その他カテゴリセクション */}
                        {otherCategories.length > 0 && (
                            <optgroup label="一般カテゴリ / その他">
                                {otherCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.nameJa}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>
            </section>

            {/* ページネーション */}
            <div>
                <button
                    disabled={filters.page <= 1}
                    onClick={() => update({ page: (filters.page - 1).toString() })}
                >
                    <span>前へ</span>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="15 19l-7-7 7-7"/></svg>
                </button>
                <span>Page {filters.page}</span>
                <button
                    disabled={initialResults.length < 50}
                    onClick={() => update({ page: (filters.page + 1).toString() })}
                >
                    <span>次へ</span>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7"/></svg>
                </button>
            </div>

            {/* 結果テーブル */}
            <div>
                <table>
                    <thead>
                    <tr>
                        <th>Term / Year</th>
                        <th>Course Title</th>
                        <th>Schedule</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {initialResults.map((course) => {
                        // コマが空でも registeredIds (コースIDのSet) を参照するので正しく動作する
                        const isAdded = registeredIds.has(course.id);
                        const loading = isSubmitting === course.id;

                        return (
                            <tr key={course.id}>
                                <td>
                                    {course.term} {course.year}
                                </td>
                                <td>
                                    <div>{course.titleJa}</div>
                                    <div>{course.titleEn}</div>
                                </td>
                                <td>
                                    {course.schedules.length > 0 ? (
                                        <div>
                                            {course.schedules.map((s, i) => (
                                                <span key={i}>
                                                        {s.dayOfWeek}{s.period}{s.isLong ? "*" : ""}
                                                    </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>No Schedule</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleToggle(course)}
                                        disabled={loading}
                                    >
                                        {loading ? '...' : (isAdded ? '削除' : '追加')}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                {initialResults.length === 0 && (
                    <div>
                        該当する授業が見つかりませんでした。
                    </div>
                )}
            </div>
        </div>
    );
}