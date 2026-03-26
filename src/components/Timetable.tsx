import React from 'react';

const MIN_HEIGHT = 1.2;
const START_TIME = 8 * 60 + 45; // 08:45
const END_TIME = 20 * 60 + 15; // 20:15

const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m - START_TIME;
};

const GRID_PERIODS = [
    { label: '1', start: '08:45', end: '10:00', next: '10:10' },
    { label: '2', start: '10:10', end: '11:25', next: '11:35' },
    { label: '3', start: '11:35', end: '12:50', next: '12:50' },
    { label: '昼', start: '12:50', end: '14:00', next: '14:00' },
    { label: '4', start: '14:00', end: '15:15', next: '15:25' },
    { label: '5', start: '15:25', end: '16:40', next: '16:50' },
    { label: '6', start: '16:50', end: '18:05', next: '18:15' },
    { label: '7', start: '18:15', end: '19:30', next: '19:30' },
    { label: 'L7', start: '19:30', end: '20:10', next: '20:15' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const courses = [
    { day: 'Mon', start: '13:20', end: '15:15', title: 'Super 4 (Long)' },
    { day: 'Mon', start: '14:00', end: '15:15', title: 'Normal 4' },
    { day: 'Mon', start: '14:30', end: '15:45', title: 'Special Seminar' },
    { day: 'Wed', start: '15:25', end: '17:20', title: 'Super 5 (Long)' },
    { day: 'Wed', start: '15:25', end: '17:20', title: 'Super 5 (Long) 2' },
    { day: 'Wed', start: '15:25', end: '16:40', title: 'Normal 5' },
    { day: 'Wed', start: '16:50', end: '18:05', title: 'Normal 6' },
];

export default function Timetable() {
    const totalHeight = (END_TIME - START_TIME) * MIN_HEIGHT;
    const HEADER_HEIGHT = 40; // 時刻+ラベルを表示するため少し高く設定

    const renderDayColumn = (day: string) => {
        const dayCourses = courses
            .filter(c => c.day === day)
            .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

        // 1. 各コマの衝突判定と仮の列(col)割り当て
        const courseWithCol: any[] = [];
        dayCourses.forEach(course => {
            const startMin = timeToMin(course.start);
            const endMin = timeToMin(course.end);
            let col = 0;
            while (courseWithCol.some(c =>
                c.col === col &&
                Math.max(startMin, c.startMin) < Math.min(endMin, c.endMin)
            )) {
                col++;
            }
            courseWithCol.push({ ...course, startMin, endMin, col });
        });

        // 2. 相互に重なっている授業を「グループ」として抽出
        // グループ内で最大の col + 1 をそのグループ全員の共通幅(groupMaxCols)にする
        const processedCourses = courseWithCol.map(course => {
            const group: any[] = [];
            const visited = new Set();
            const queue = [course];

            // 幅の計算に影響を与える「連鎖的な重なり」をすべて探す（幅の同期）
            while (queue.length > 0) {
                const current = queue.shift();
                if (visited.has(current.title + current.start)) continue;
                visited.add(current.title + current.start);
                group.push(current);

                courseWithCol.forEach(other => {
                    if (Math.max(current.startMin, other.startMin) < Math.min(current.endMin, other.endMin)) {
                        queue.push(other);
                    }
                });
            }

            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;
            return { ...course, groupMaxCols };
        });

        return (
            <div key={day} style={{ flex: 1, borderRight: '1px solid #ccc', position: 'relative', height: totalHeight + HEADER_HEIGHT }}>
                {/* 曜日ヘッダー */}
                <div style={{
                    textAlign: 'center', borderBottom: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold',
                    height: HEADER_HEIGHT, lineHeight: `${HEADER_HEIGHT}px`, backgroundColor: '#fdfdfd'
                }}>{day}</div>

                {/* 背景グリッド */}
                {GRID_PERIODS.map(p => (
                    <div key={p.label} style={{
                        position: 'absolute',
                        top: timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT,
                        height: (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT,
                        width: '100%',
                        borderBottom: '1px solid #eee',
                        borderTop: '1px solid #eee',
                        boxSizing: 'border-box',
                        backgroundColor: '#fafafa'
                    }} />
                ))}

                {/* コマの描画 */}
                {processedCourses.map((course, i) => {
                    // groupMaxCols を使うことで、右側の隙間を埋める
                    const width = 100 / course.groupMaxCols;
                    const left = course.col * width;
                    const top = course.startMin * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (course.endMin - course.startMin) * MIN_HEIGHT;

                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                            border: '1px solid #333',
                            backgroundColor: 'white',
                            zIndex: 10,
                            padding: '4px',
                            fontSize: '11px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '1px 1px 2px rgba(0,0,0,0.05)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>{course.title}</div>
                            <div style={{ fontSize: '9px', color: '#666', marginTop: 'auto' }}>{course.start}-{course.end}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex', border: '1px solid #ccc', borderRight: 'none',
            fontFamily: 'sans-serif', backgroundColor: '#fff', width: '100%'
        }}>
            {/* 時刻軸 */}
            <div style={{ width: '65px', borderRight: '1px solid #ccc', position: 'relative', backgroundColor: '#fdfdfd' }}>
                <div style={{ height: HEADER_HEIGHT, borderBottom: '1px solid #ccc' }} />
                {GRID_PERIODS.map(p => {
                    const top = timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT;
                    const isLunch = p.label === '昼';

                    return (
                        <div key={p.label} style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                        }}>
                            {/* 開始時刻（線の真上） */}
                            <div style={{
                                fontSize: '10px', color: '#333', fontWeight: 'bold',
                                position: 'absolute', top: 0,
                                backgroundColor: '#fdfdfd', padding: '0 2px', zIndex: 1
                            }}>
                                {p.start}
                            </div>

                            {/* 中央エリア（ラベル、および昼休みのみ時刻） */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                width: '100%'
                            }}>
                                <div style={{ fontSize: '15px', color: '#bbb', fontWeight: 'bold', lineHeight: 1 }}>
                                    {p.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {DAYS.map(renderDayColumn)}
        </div>
    );
}