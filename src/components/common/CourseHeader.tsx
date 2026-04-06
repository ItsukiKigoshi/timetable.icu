import type {CourseWithSchedules} from "@/db/schema";
import {formatUnits} from "@/lib/course/utils.ts";
import {useTranslation} from "@/lib/translation/context.tsx";
import {useMemo} from "react";

//  --- 授業の概要 コースコード，言語，単位，タイトル，教員 ---
const CourseHeader = ({
                          course,
                          colorCustom,
                          showColor = false,
                          showYearTerm = false,
                      }: {
    course: CourseWithSchedules,
    colorCustom?: string | null;
    showColor?: boolean;
    showYearTerm?: boolean;
}) => {
    const {t, isJa} = useTranslation();

    // 1. そもそもshowColorがfalse なら何も表示しない
    // 2. showColorがtrueならcolorCustomを優先し，なければデフォルト値を使う
    const barColor = useMemo(() => {
        if (!showColor) return null;
        return colorCustom ?? 'var(--color-primary)';
    }, [showColor, colorCustom]);

    return (
        <div className="flex gap-3 w-full">
            {/* 左側の縦棒 (showColor が有効で色がある場合のみ表示) */}
            {barColor && (
                <div
                    className="w-1 rounded-full shrink-0 my-1 shadow-sm transition-colors duration-500"
                    style={{ backgroundColor: barColor }}
                />
            )}

            <section className="flex flex-col gap-2 w-full min-w-0">
                {/* 1. 上段: コースコード / 言語 / 単位 / 年度 */}
                <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="badge badge-neutral badge-xs px-1.5 py-2 font-mono tracking-tighter shrink-0">
                        {course.courseCode}
                    </span>

                    {course.language && (
                        <span className="badge badge-xs font-bold badge-outline text-base-content/50">
                            {course.language}
                        </span>
                    )}

                    {course.units > 0 && (
                        <span className="badge badge-outline badge-xs text-base-content/50">
                            {formatUnits(course.units)} {t('explore.units')}
                        </span>
                    )}

                    {showYearTerm && (
                        <span className="text-[10px] sm:text-xs text-base-content/40 whitespace-nowrap ml-auto">
                            {course.year} {course.term}
                        </span>
                    )}
                </div>

                {/* 2. 中段: タイトル (太字) */}
                <h2 className="text-sm sm:text-base font-bold leading-tight line-clamp-2 text-base-content">
                    {isJa ? course.titleJa : course.titleEn}
                </h2>

                {/* 3. 下段: 教員名 */}
                <p className="text-xs sm:text-sm text-base-content/60 truncate italic">
                    {course.instructor}
                </p>

                {/* 4. 最下段: スケジュール (チップ) */}
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {course.schedules?.length > 0 ? (
                        course.schedules.map((s, i) => (
                            <span key={i}
                                  className="px-1.5 py-0.5 rounded bg-base-200 text-[10px] font-mono font-bold uppercase border border-base-300">
                                {s.dayOfWeek.slice(0, 2)}{s.period}{s.isLong ? "*" : ""}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] opacity-40 italic">{t('explore.no_schedule')}</span>
                    )}
                </div>
            </section>
        </div>
    );
};
export default CourseHeader