// src/components/CourseManager.tsx
import { useState, useMemo } from 'react';
import type { User } from "better-auth";
import TimetableInterface, { type ProcessedSchedule } from '@/components/TimetableInterface';
import CourseList from '@/components/CourseList';

interface CourseManagerProps {
    initialSchedules: ProcessedSchedule[];
    user: User;
}

export default function CourseManager({ initialSchedules, user }: CourseManagerProps) {
    // 元のuseTimetableフックのロジック（もしコースの追加削除があるならここで行う）
    // 今回は表示のみなので、propsをそのままStateに入れる
    const [schedules, setSchedules] = useState<ProcessedSchedule[]>(initialSchedules);

    // --- メモリ消費の最適化: useMemo ---
    // schedulesはコマ単位の配列（週3回の授業なら3要素）。
    // リスト表示用に、コース単位（unique）の配列をメモ化して生成する。
    // これにより、CourseListが再描画されても計算は走らない。
    const uniqueCourses = useMemo(() => {
        const courseMap = new Map<string, ProcessedSchedule>();

        schedules.forEach(sched => {
            // 既にMapにある場合は、曜日時限の情報を追記するなどの処理も可能
            // ここでは単純化のため、最初の1コマ目のデータを使用
            if (!courseMap.has(sched.courseId.toString())) {
                courseMap.set(sched.courseId.toString(), sched);
            }
        });

        return Array.from(courseMap.values());
    }, [schedules]);

    return (
        <div className="flex flex-col xl:flex-row gap-6">
            {/* 左側: 時間割（メイン） */}
            <div className="flex-1 overflow-x-auto">
                <TimetableInterface processedSchedules={schedules} user={user} />
            </div>

            {/* 右側: コースリスト（サイドバー） */}
            <div className="w-full xl:w-96 flex-shrink-0">
                <CourseList courses={uniqueCourses} />
            </div>
        </div>
    );
}