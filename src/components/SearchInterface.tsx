import React, {useState} from 'react';
import type {Categories, CourseWithSchedules} from "@/db/schema";

export interface SearchFilters {
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
    initialUserCourseIds: number[];
}


export default function SearchInterface({
                                            initialResults,
                                            filters,
                                            isLoggedIn,
                                            categories,
                                            initialUserCourseIds
                                        }: Props) {
    // 登録済みIDをステートで管理
    const [userCourseIds, setUserCourseIds] = useState<Set<number>>(new Set(initialUserCourseIds));
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    const toggleRegistration = async (courseId: number) => {
        if (!isLoggedIn) {
            alert("ログインが必要です");
            return;
        }

        setIsSubmitting(courseId);
        try {
            const res = await fetch('/api/courses/toggle', {
                method: 'POST',
                body: JSON.stringify({courseId}),
                headers: {'Content-Type': 'application/json'}
            });

            if (res.ok) {
                const nextIds = new Set(userCourseIds);
                if (nextIds.has(courseId)) nextIds.delete(courseId);
                else nextIds.add(courseId);
                setUserCourseIds(nextIds);
            }
        } finally {
            setIsSubmitting(null);
        }
    };

    const update = (params: Partial<Record<keyof SearchFilters | 'category', string | null>>) => {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([k, v]) => {
            // パラメータ名の正規化 (categoryId と category の不一致対策)
            const key = k === 'categoryId' ? 'category' : k;
            if (v) url.searchParams.set(key, v);
            else url.searchParams.delete(key);
        });

        if (!params.hasOwnProperty('page')) url.searchParams.delete('page');
        window.location.assign(url.toString());
    };

    return (
        <div>
            <section style={{display: 'flex', gap: '8px', marginBottom: '1rem'}}>
                <input
                    type="text"
                    className="border p-1 rounded"
                    placeholder="タイトル、教員名..."
                    defaultValue={filters.q || ''}
                    onKeyDown={(e) => e.key === 'Enter' && update({q: e.currentTarget.value})}
                />
                <select
                    value={filters.day || ''}
                    onChange={(e) => update({day: e.target.value})}
                >
                    <option value="">曜日</option>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                    value={filters.period || ''}
                    onChange={(e) => update({period: e.target.value})}
                >
                    <option value="">時限</option>
                    {[1, 2, 3, 4, 5, 6, 7].map(p => <option key={p} value={p.toString()}>{p}</option>)}
                </select>

                <select
                    value={filters.categoryId || ''}
                    onChange={(e) => update({categoryId: e.target.value})}
                    className="max-w-50"
                >
                    <option value="">カテゴリ (全て)</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nameJa}</option>
                    ))}
                </select>
            </section>

            <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                <tr>
                    <th>RG No</th>
                    <th>Title</th>
                    <th>Schedule</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {initialResults.map((course) => {
                    const isAdded = userCourseIds.has(course.id);
                    return (
                        <tr key={course.id}>
                            <td>{course.rgNo}</td>
                            <td>{course.titleJa}</td>
                            <td>{course.schedules.map(s => `${s.isLong && "*"}${s.period}/${s.dayOfWeek}`).join(',')}</td>
                            <td>
                                <button
                                    onClick={() => toggleRegistration(course.id)}
                                    disabled={isSubmitting === course.id}
                                >
                                    {isAdded ? '削除' : '追加'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

            <div style={{
                display: 'flex',
            }}>
                <button
                    disabled={filters.page <= 1}
                    onClick={() => update({page: (filters.page - 1).toString()})}
                >
                    ＜
                </button>

                <span style={{fontWeight: 'bold'}}>
                    Page {filters.page}
                  </span>
                <button
                    disabled={initialResults.length < 20} // 取得件数がlimit未満なら次はないと判断
                    onClick={() => update({page: (filters.page + 1).toString()})}
                >
                    ＞
                </button>
            </div>
        </div>
    );
}