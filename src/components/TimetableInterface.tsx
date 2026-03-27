import React from 'react';
import type { FlatSchedule } from "@/db/schema.ts";
import { END_TIME, PERIODS, START_TIME } from "@/constants/time.ts";

const MIN_HEIGHT = 1.2;
const HEADER_HEIGHT = 40;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// サーバーから渡される加工済みデータの型定義
export interface ProcessedSchedule extends FlatSchedule {
    startMin: number;
    displayEndMin: number;
    col: number;
    groupMaxCols: number;
}

interface TimetableProps {
    schedules: ProcessedSchedule[];
}

// 共通の時刻計算関数（定数を使用して計算のみ行う）
const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m - START_TIME;
};

export default function TimetableInterface({ schedules }: TimetableProps) {
    const totalHeight = (END_TIME - START_TIME) * MIN_HEIGHT;

    const renderDayColumn = (dayOfWeek: string) => {
        const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

        return (
            <div
                key={dayOfWeek}
                className="flex-1 border-r border-gray-300 relative"
                style={{ height: totalHeight + HEADER_HEIGHT }}
            >
                {/* 背景グリッド描画 */}
                {PERIODS.map(p => (
                    <div
                        key={p.label}
                        className="absolute w-full border-t border-gray-100"
                        style={{
                            top: timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT,
                            height: (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT,
                        }}
                    />
                ))}

                {/* 曜日ヘッダー */}
                <div
                    className="text-center border-b border-gray-300 text-[12px] font-bold"
                    style={{ height: HEADER_HEIGHT, lineHeight: `${HEADER_HEIGHT}px` }}
                >
                    {dayOfWeek}
                </div>

                {/* コマの描画 */}
                {daySchedules.map((sched, i) => {
                    const width = 100 / sched.groupMaxCols;
                    const left = sched.col * width;
                    const top = sched.startMin * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (sched.displayEndMin - sched.startMin) * MIN_HEIGHT;

                    return (
                        <div
                            key={`${sched.courseCode}-${i}`}
                            className="absolute border border-[#444] bg-white z-10 p-1.5 text-[11px] flex flex-col overflow-hidden box-border"
                            style={{
                                top: `${top}px`,
                                height: `${height - 1}px`,
                                left: `${left}%`,
                                width: `${width}%`,
                            }}
                        >
                            <div className="font-bold leading-[1.2]">{sched.titleJa}</div>
                            <div className="text-[9px] text-gray-500 mt-auto">
                                {sched.startTime}-{sched.endTime}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex border border-gray-300 border-r-0 font-sans w-full bg-white">
            {/* 時刻軸（左端のPeriod表示） */}
            <div className="w-16.25 border-r border-gray-300 relative">
                <div
                    className="border-b border-gray-300"
                    style={{ height: HEADER_HEIGHT }}
                />
                {PERIODS.map(p => {
                    const top = timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT;
                    return (
                        <div
                            key={p.label}
                            className="absolute w-full flex flex-col items-center box-border"
                            style={{ top: `${top}px`, height: `${height}px` }}
                        >
                            <div className="text-[10px] text-gray-800 font-bold absolute top-0 px-0.5 z-10">
                                {p.start}
                            </div>
                            <div className="flex items-center justify-center h-full w-full">
                                <div className="text-[15px] font-bold leading-none">{p.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 各曜日のカラム */}
            {DAYS.map(renderDayColumn)}
        </div>
    );
}