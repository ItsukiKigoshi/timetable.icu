import React from 'react';

const MIN_HEIGHT = 0.8;
const START_TIME = 8 * 60 + 45; // 08:45
const END_TIME = 20 * 60 + 15; // 20:15

const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m - START_TIME;
};

const GRID_PERIODS = [
    { label: '1', start: '08:45', end: '10:00' },
    { label: '2', start: '10:10', end: '11:25' },
    { label: '3', start: '11:35', end: '12:50' },
    { label: '昼', start: '12:50', end: '14:00' },
    { label: '4', start: '14:00', end: '15:15' },
    { label: '5', start: '15:25', end: '16:40' },
    { label: '6', start: '16:50', end: '18:05' },
    { label: '7', start: '18:15', end: '19:30' },
    { label: '終', start: '19:30', end: '20:10' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// テスト用データ: 3つ重なるケース (Mon 4限付近)
const courses = [
    { day: 'Mon', start: '13:20', end: '15:15', title: 'Super 4 (Long)' },
    { day: 'Mon', start: '14:00', end: '15:15', title: 'Normal 4' },
    { day: 'Mon', start: '14:30', end: '15:45', title: 'Special Seminar' }, // 3つ目の重なり
    { day: 'Wed', start: '15:25', end: '17:20', title: 'Super 5 (Long)' },
    { day: 'Wed', start: '15:25', end: '17:20', title: 'Super 5 (Long) 2' },
    { day: 'Wed', start: '15:25', end: '16:40', title: 'Normal 5' },
    { day: 'Wed', start: '16:50', end: '18:05', title: 'Normal 6' },
];

export default function Timetable() {
    const totalHeight = (END_TIME - START_TIME) * MIN_HEIGHT;

    // 各曜日の描画ロジック
    const renderDayColumn = (day: string) => {
        const dayCourses = courses
            .filter(c => c.day === day)
            .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

        // 重複を計算して列(column)を割り当てる
        const columns: any[][] = [];
        dayCourses.forEach(course => {
            let placed = false;
            const start = timeToMin(course.start);

            for (let i = 0; i < columns.length; i++) {
                // この列の最後の要素と重なっていないか確認
                const lastInCol = columns[i][columns[i].length - 1];
                if (timeToMin(lastInCol.end) <= start) {
                    columns[i].push(course);
                    placed = true;
                    break;
                }
            }
            if (!placed) columns.push([course]);
        });

        const numCols = columns.length;

        return (
            <div key={day} style={{ flex: 1, borderRight: '1px solid black', position: 'relative', height: totalHeight }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid black', fontSize: '12px', height: '20px' }}>{day}</div>

                {/* 背景線 */}
                {GRID_PERIODS.map(p => (
                    <div key={p.label} style={{
                        position: 'absolute', top: timeToMin(p.start) * MIN_HEIGHT + 20,
                        width: '100%', height: (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT,
                        borderBottom: '1px dashed #ddd', pointerEvents: 'none'
                    }} />
                ))}

                {/* コマの描画 */}
                {columns.map((col, colIndex) =>
                    col.map((course, i) => {
                        const top = timeToMin(course.start) * MIN_HEIGHT + 20;
                        const height = (timeToMin(course.end) - timeToMin(course.start)) * MIN_HEIGHT;
                        const width = 100 / numCols;
                        const left = width * colIndex;

                        return (
                            <div key={`${colIndex}-${i}`} style={{
                                position: 'absolute',
                                top, height, left: `${left}%`, width: `${width}%`,
                                border: '1px solid black', backgroundColor: 'white',
                                zIndex: 1, padding: '2px', fontSize: '10px', overflow: 'hidden', boxSizing: 'border-box'
                            }}>
                                <strong>{course.title}</strong><br/>
                                {course.start}-{course.end}
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', border: '1px solid black', fontFamily: 'monospace', backgroundColor: '#fff' }}>
            {/* 時刻軸 */}
            <div style={{ width: '40px', borderRight: '1px solid black', position: 'relative', height: totalHeight + 20 }}>
                <div style={{ height: '20px', borderBottom: '1px solid black' }} />
                {GRID_PERIODS.map(p => (
                    <div key={p.label} style={{
                        position: 'absolute', top: timeToMin(p.start) * MIN_HEIGHT + 20,
                        width: '100%', fontSize: '9px', textAlign: 'center'
                    }}>
                        {p.label}
                    </div>
                ))}
            </div>

            {DAYS.map(renderDayColumn)}
        </div>
    );
}