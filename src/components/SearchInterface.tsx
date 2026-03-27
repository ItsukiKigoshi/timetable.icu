import React from 'react';
import type {InferSelectModel} from 'drizzle-orm';
import * as schema from '../db/schema';

export type Course = InferSelectModel<typeof schema.courses>;
export type Schedule = InferSelectModel<typeof schema.courseSchedules>;

export interface CourseWithSchedules extends Course {
    schedules: Schedule[];
}

export interface SearchFilters {
    day: string | null;
    period: string | null;
    isLong: string | null;
    categoryId: string | null;
    page: number;
}

interface Props {
    initialResults: CourseWithSchedules[];
    filters: SearchFilters;
}

export default function SearchInterface({initialResults, filters}: Props) {
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

                <input
                    type="text"
                    placeholder="Category (e.g. ELA)"
                    defaultValue={filters.categoryId || ''}
                    onBlur={(e) => update({categoryId: e.target.value})}
                />
            </section>

            <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                <tr>
                    <th>RG No</th>
                    <th>Title</th>
                    <th>Instructor</th>
                    <th>Schedule</th>
                </tr>
                </thead>
                <tbody>
                {initialResults.map((course) => (
                    <tr key={course.id}>
                        <td>{course.rgNo}</td>
                        <td>{course.titleJa}</td>
                        <td>{course.instructor}</td>
                        <td>
                            {course.schedules.map(s =>
                                `${s.dayOfWeek}${s.period}${s.isLong ? 'L' : ''}`
                            ).join(' / ')}
                        </td>
                    </tr>
                ))}
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