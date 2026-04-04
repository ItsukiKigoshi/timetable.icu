import type {UserCourseWithDetails} from "@/db/schema";
import {formatUnits} from "@/lib/course/utils.ts";

//  --- 授業の概要 コースコード，言語，単位，タイトル，教員 ---
export const CourseHeader = ({
                          course,
                          isJa,
                          t,
                      }: {
    course: UserCourseWithDetails,
    isJa: boolean,
    t: any,
    translateDay?: (day: string) => string
}) => (
    <section className="flex flex-col gap-2 w-full">
        {/* 1. 上段: コースコード / 言語 / 単位 / 年度 (左詰め・ひとかたまり) */}
        <div className="flex flex-wrap gap-1.5 items-center">
            {/* コースコード */}
            <span className="badge badge-neutral badge-xs px-1.5 py-2 font-mono tracking-tighter shrink-0">
            {course.courseCode}
        </span>

            {/* 言語 */}
            {course.language && (
                <span className="badge badge-xs font-bold badge-outline text-base-content/50">
                {course.language}
            </span>
            )}

            {/* 単位数 */}
            {course.units > 0 && (
                <span className="badge badge-outline badge-xs text-base-content/50">
                {formatUnits(course.units)} {t('explore.units')}
            </span>
            )}

            {/* 年度・学期*/}
            <span className="text-[10px] sm:text-xs text-base-content/40 whitespace-nowrap ml-1">
            {course.year} {course.term}
        </span>
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
                    <span key={i} className="px-1.5 py-0.5 rounded bg-base-200 text-[10px] font-mono font-bold uppercase border border-base-300">
                    {s.dayOfWeek.slice(0, 2)}{s.period}{s.isLong ? "*" : ""}
                </span>
                ))
            ) : (
                <span className="text-[10px] opacity-40 italic">{t('explore.no_schedule')}</span>
            )}
        </div>
    </section>
);