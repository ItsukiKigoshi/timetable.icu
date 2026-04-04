import type {FlatSchedule} from "@/db/schema";
import {SELECTABLE_DAYS} from "@/constants/time.ts";

/**
 * Hour to Min
 * E.g.: 8:15 -> 8 * 60 + 15 -> 495
 */
export const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// 描画の基準となる定数
export const TIMETABLE_CONFIG = {
    START_TIME: "08:45",
    MINUTE_HEIGHT: 1.2, // 1分あたり何pxか (調整可能)
    HEADER_HEIGHT: 40,
} as const;

export interface DisplaySchedule extends FlatSchedule {
    startMin: number;
    endMin: number;
    col: number;
    groupMaxCols: number;
    // 描画用のスタイルを事前計算して保持
    style: {
        top: number;
        height: number;
        left: string;
        width: string;
    };
}

// Flat Schedule（平坦化されたSchedule+Course）に, 時間割描画に必要な情報（startMin, endMin, col, groupMaxCols, styles）を付加
export const computeDisplaySchedules = (schedules: FlatSchedule[]): DisplaySchedule[] => {
    const allProcessed: DisplaySchedule[] = [];
    const baseMin = timeToMin(TIMETABLE_CONFIG.START_TIME);

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
                // 衝突判定．絶対値(startMin)同士で比較
                Math.max(startMin, c.startMin) < Math.min(endMin, c.endMin)
            )) {
                col++;
            }
            tempWithCol.push({...sched as any, startMin, endMin, col});
        });

        // 4. 幅計算 ＋ スタイル計算
        tempWithCol.forEach(sched => {
            const group = tempWithCol.filter(other =>
                Math.max(sched.startMin, other.startMin) < Math.min(sched.endMin, other.endMin)
            );
            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;

            // --- ここで座標を事前計算 ---
            const top = (sched.startMin - baseMin) * TIMETABLE_CONFIG.MINUTE_HEIGHT + TIMETABLE_CONFIG.HEADER_HEIGHT;
            const height = (sched.endMin - sched.startMin) * TIMETABLE_CONFIG.MINUTE_HEIGHT;
            const left = `${(sched.col * 100) / groupMaxCols}%`;
            const width = `calc(${(100 / groupMaxCols)}% - 1px)`;

            allProcessed.push({
                ...sched,
                groupMaxCols,
                style: { top, height, left, width }
            });
        });
    });

    return allProcessed;
}