// TODO - useTimetable.tsとともに最適化

import type {FlatSchedule} from "@/db/schema";
import {END_TIME, SELECTABLE_DAYS, START_TIME} from "@/constants/time";

// Hour to Minute
export const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m - START_TIME;
};

// サーバー・クライアント共通で使う型
export interface ProcessedSchedule extends FlatSchedule {
    startMin: number;
    displayEndMin: number;
    col: number;
    groupMaxCols: number;
}


// FlatSchedule -> ProcessedSchedule (with Canvas Setting)
export function computeProcessedSchedules(schedules: FlatSchedule[]): ProcessedSchedule[] {
    const allProcessed: ProcessedSchedule[] = [];

    SELECTABLE_DAYS.forEach(day => {
        // 1. 抽出・ソート
        const daySchedules = schedules
            .filter(s => s.dayOfWeek === day)
            .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

        // 2. 結合
        const merged: FlatSchedule[] = [];
        daySchedules.forEach(current => {
            const currentStart = timeToMin(current.startTime);
            const target = merged.find(m => {
                const mEnd = timeToMin(m.endTime);
                return m.courseCode === current.courseCode && (currentStart - mEnd) <= 10;
            });
            if (target) {
                target.endTime = current.endTime;
            } else {
                merged.push({...current});
            }
        });

        // 3. 衝突・列計算
        const tempWithCol: (FlatSchedule & {
            startMin: number;
            endMin: number;
            col: number;
            displayEndMin: number
        })[] = [];
        merged.forEach(sched => {
            const startMin = timeToMin(sched.startTime);
            const endMin = timeToMin(sched.endTime);
            const displayEndMin = Math.min(endMin + 10, END_TIME - START_TIME);

            let col = 0;
            while (tempWithCol.some(c =>
                c.col === col &&
                Math.max(startMin, c.startMin) < Math.min(displayEndMin, c.displayEndMin)
            )) {
                col++;
            }
            tempWithCol.push({...sched, startMin, endMin, displayEndMin, col});
        });

        // 4. 幅計算
        tempWithCol.forEach(sched => {
            const group = tempWithCol.filter(other =>
                Math.max(sched.startMin, other.startMin) < Math.min(sched.displayEndMin, other.displayEndMin)
            );
            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;
            allProcessed.push({...sched, groupMaxCols});
        });
    });

    return allProcessed;
}