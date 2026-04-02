// TODO - useTimetable.tsとともに最適化

import type {FlatSchedule} from "@/db/schema";
import {SELECTABLE_DAYS} from "@/constants/time";

// Hour to Minute
export const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// サーバー・クライアント共通で使う型
export interface ProcessedSchedule extends FlatSchedule {
    startMin: number;
    endMin: number;
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
                // rgNoが一致，かつ時間帯が10分以内であれば結合
                return m.rgNo === current.rgNo && (currentStart - mEnd) <= 10;
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

            let col = 0;
            // ...衝突判定ロジック...
            while (tempWithCol.some(c =>
                c.col === col &&
                // 衝突判定。ここでも絶対値(startMin)同士で比較するのでOK
                Math.max(startMin, c.startMin) < Math.min(endMin, c.endMin)
            )) {
                col++;
            }
            tempWithCol.push({...sched as any, startMin, endMin, col});
        });

        // 4. 幅計算
        tempWithCol.forEach(sched => {
            const group = tempWithCol.filter(other =>
                Math.max(sched.startMin, other.startMin) < Math.min(sched.endMin, other.endMin)
            );
            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;
            allProcessed.push({...sched, groupMaxCols});
        });
    });

    return allProcessed;
}