import type {UserCourseWithDetails} from "@/db/schema";
import {formatUnits} from "@/lib/course/utils.ts";
import {useTranslation} from "@/lib/translation/context.tsx";
import {useMemo} from "react";

const CourseHeader = ({
                          course,
                          colorCustom,
                          showColor = false,
                          showYearTerm = false,
                      }: {
    course: UserCourseWithDetails,
    colorCustom?: string | null;
    showColor?: boolean;
    showYearTerm?: boolean;
}) => {
    const {t, isJa} = useTranslation();

    // 1. カラーバーのロジック
    const barColor = useMemo(() => {
        if (!showColor) return null;
        return colorCustom ?? 'var(--color-primary)';
    }, [showColor, colorCustom]);

    // 2. 公式科目かカスタム科目かの判定（型ガード）
    const isOfficial = course.type === 'official';

    return (
        <div className="flex gap-3 w-full">
            {/*カラーバー*/}
            {barColor && (
                <div
                    className="w-1.5 rounded-full shrink-0 my-1 shadow-sm transition-colors duration-500"
                    style={{ backgroundColor: barColor }}
                />
            )}

            <section className="flex flex-col gap-2 w-full min-w-0">
                {/* 1. 上段: 公式科目特有の情報は isOfficial で保護 */}
                <div className="flex flex-wrap gap-1.5 items-center">
                    {isOfficial && course.courseCode && (
                        <span className="badge badge-neutral badge-xs px-1.5 py-2 font-mono tracking-tighter shrink-0">
                            {course.courseCode}
                        </span>
                    )}

                    {isOfficial && course.language && (
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

                {/* 2. 中段: タイトル */}
                <h2 className="text-sm sm:text-base font-bold leading-tight line-clamp-2 text-base-content">
                    {isJa ? ((course as any).titleJa || (course as any).title) : ((course as any).titleEn || (course as any).title)}
                </h2>

                {/* 3. 下段: 教員名 (共通プロパティ) */}
                <p className="text-xs sm:text-sm text-base-content/60 truncate italic">
                    {course.instructor}
                </p>

                {/* 4. 最下段: スケジュール (共通プロパティ) */}
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {course.schedules && course.schedules.length > 0 ? (
                        course.schedules.map((s, i) => (
                            <span key={i}
                                  className="px-1.5 py-0.5 rounded bg-base-200 text-[10px] font-mono font-bold uppercase border border-base-300">
                                {s.dayOfWeek.slice(0, 2)}{s.period}{'isLong' in s && s.isLong ? "*" : ""}
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
export default CourseHeader;