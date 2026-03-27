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
            <div key={dayOfWeek} style={{ flex: 1, borderRight: '1px solid #ccc', position: 'relative', height: totalHeight + HEADER_HEIGHT }}>
                {/* 背景グリッド描画 */}
                {PERIODS.map(p => (
                    <div key={p.label} style={{
                        position: 'absolute',
                        top: timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT,
                        height: (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT,
                        width: '100%', borderTop: '1px solid #eee'
                    }}/>
                ))}

                {/* 曜日ヘッダー */}
                <div style={{
                    textAlign: 'center', borderBottom: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold',
                    height: HEADER_HEIGHT, lineHeight: `${HEADER_HEIGHT}px`
                }}>{dayOfWeek}</div>

                {/* コマの描画 */}
                {daySchedules.map((sched, i) => {
                    const width = 100 / sched.groupMaxCols;
                    const left = sched.col * width;
                    const top = sched.startMin * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (sched.displayEndMin - sched.startMin) * MIN_HEIGHT;

                    return (
                        <div key={`${sched.courseCode}-${i}`} style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height - 1}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                            border: '1px solid #444',
                            backgroundColor: 'white',
                            zIndex: 10,
                            padding: '6px',
                            fontSize: '11px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>{sched.titleJa}</div>
                            <div style={{ fontSize: '9px', color: '#666', marginTop: 'auto' }}>
                                {sched.startTime}-{sched.endTime}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', border: '1px solid #ccc', borderRight: 'none', fontFamily: 'sans-serif', width: '100%', backgroundColor: '#fff' }}>
            {/* 時刻軸（左端のPeriod表示） */}
            <div style={{ width: '65px', borderRight: '1px solid #ccc', position: 'relative' }}>
                <div style={{ height: HEADER_HEIGHT, borderBottom: '1px solid #ccc' }} />
                {PERIODS.map(p => {
                    const top = timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT;
                    return (
                        <div key={p.label} style={{ position: 'absolute', top: `${top}px`, height: `${height}px`, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#333', fontWeight: 'bold', position: 'absolute', top: 0 }}>{p.start}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{p.label}</div>
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