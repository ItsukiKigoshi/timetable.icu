import type {UserCourseWithDetails} from "@/db/schema";
import {Eye, EyeOff, Trash2} from "lucide-react";
import {useTranslation} from "@/lib/translation/context.tsx";
import CourseHeader from "@/components/common/CourseHeader.tsx";

interface CourseListProps {
    items: UserCourseWithDetails[];
    padding?: boolean;
    isJa: boolean;
    t: any;
    setSelectedCourse: (course: UserCourseWithDetails) => void;
    toggleVisibility: (courseId: number | string) => void;
    handleToggle: (course: UserCourseWithDetails) => void;
    isSubmitting: number | string | null;
}

const CourseList = ({
                        items,
                        padding = true,
                        setSelectedCourse,
                        toggleVisibility,
                        handleToggle,
                        isSubmitting,
                    }: CourseListProps) => {
    const {t} = useTranslation();
    return (
        <div className={`flex flex-col gap-2 w-full ${padding ? 'p-2' : ''}`}>
            {items.map(course => {
                    return (
                        <div key={course.id}
                             className={`group p-3 bg-base-300 rounded-xl flex justify-between items-center border border-base-300 ${!course.isVisible ? "opacity-60" : ""}`}>

                            {/* 左側：クリックで詳細モーダルへ */}
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                                setSelectedCourse(course);
                                (document.getElementById('single_course_modal') as HTMLDialogElement)?.showModal();
                            }}>
                                <CourseHeader course={course} showColor={true} colorCustom={course.colorCustom} />
                            </div>

                            {/* 右側：最小限のクイック操作のみ残す */}
                            <div className="flex gap-1 shrink-0 ml-2">
                                <button onClick={() => toggleVisibility(course.id)}
                                        className="btn btn-sm btn-square btn-ghost border-base-300">
                                    {course.isVisible ? <Eye size="14"/> : <EyeOff size="14" className="text-error"/>}
                                </button>
                                <button onClick={() => handleToggle(course)}
                                        disabled={isSubmitting === course.id}
                                        className="btn btn-sm btn-square btn-error">
                                    {isSubmitting === course.id ? <span className="loading loading-spinner loading-xs"/> :
                                        <Trash2 size="14"/>}
                                </button>
                            </div>
                        </div>
                );
            })}

            {items.length === 0 && (
                <div className="text-center py-10 opacity-50 text-sm">{t('timetable.no_courses')}</div>
            )}
        </div>
    );
};
export default CourseList