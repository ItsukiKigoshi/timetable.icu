import type {APIRoute} from "astro";
import {drizzle} from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {env} from "cloudflare:workers";

interface CustomCourseRequestBody {
    id?: number;
    title: string;
    instructor?: string;
    units?: number; // number型として扱う
    memo?: string;
    room?: string;
    colorCustom?: string | null;
    year: number;
    term: string;
    isVisible?: boolean;
    schedules: {
        dayOfWeek: (typeof schema.daysEnum)[number];
        period: string;
        startTime: string;
        endTime: string;
    }[];
}

// --- POST (新規作成) ---
export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    try {
        const body = (await request.json()) as CustomCourseRequestBody;
        const { title, instructor, units, memo, room, colorCustom, schedules, year, term } = body;

        if (!title || !schedules?.length) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const db = drizzle(env.timetable_icu, { schema });

        // 1. まず親（Course）をインサートして ID を取得
        const [insertedCourse] = await db.insert(schema.customCourses).values({
            userId: user.id,
            title,
            instructor,
            units: (units || 0),
            memo,
            room,
            colorCustom,
            year,
            term,
            isVisible: true,
        }).returning();

        // 2. 子（Schedules）を準備してインサート
        const scheduleValues = schedules.map((s) => ({
            customCourseId: insertedCourse.id,
            dayOfWeek: s.dayOfWeek,
            period: s.period,
            startTime: s.startTime,
            endTime: s.endTime,
        }));

        await db.insert(schema.customCourseSchedules).values(scheduleValues);

        return new Response(JSON.stringify({ success: true, id: insertedCourse.id }), { status: 201 });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};

// --- PATCH (更新) ---
export const PATCH: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    try {
        const body = (await request.json()) as CustomCourseRequestBody;
        const { id, title, instructor, units, memo, room, colorCustom, schedules, isVisible } = body;

        if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });

        const db = drizzle(env.timetable_icu, { schema });

        // バッチ処理の準備
        const batchQueries: any[] = [];

        // 1. 基本情報の更新クエリ
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (instructor !== undefined) updateData.instructor = instructor;
        if (units !== undefined) updateData.units = units;
        if (memo !== undefined) updateData.memo = memo;
        if (room !== undefined) updateData.room = room;
        if (colorCustom !== undefined) updateData.colorCustom = colorCustom;
        if (isVisible !== undefined) updateData.isVisible = isVisible;

        if (Object.keys(updateData).length > 0) {
            batchQueries.push(
                db.update(schema.customCourses)
                    .set(updateData)
                    .where(and(eq(schema.customCourses.id, id), eq(schema.customCourses.userId, user.id)))
            );
        }

        // 2. スケジュールの更新クエリ (Delete -> Re-insert)
        if (schedules) {
            batchQueries.push(
                db.delete(schema.customCourseSchedules).where(eq(schema.customCourseSchedules.customCourseId, id))
            );

            const scheduleValues = schedules.map((s) => ({
                customCourseId: id,
                dayOfWeek: s.dayOfWeek,
                period: s.period,
                startTime: s.startTime,
                endTime: s.endTime,
            }));

            if (scheduleValues.length > 0) {
                batchQueries.push(db.insert(schema.customCourseSchedules).values(scheduleValues));
            }
        }

        if (batchQueries.length > 0) {
            // D1のバッチ実行でアトミックに更新
            await db.batch(batchQueries as any);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};

// --- DELETE (削除) ---
export const DELETE: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    try {
        const { id } = await request.json() as { id: number };
        const db = drizzle(env.timetable_icu, { schema });

        // schemaで onDelete: "cascade" を設定しているので、本体を消せばスケジュールも消える
        await db.delete(schema.customCourses)
            .where(and(eq(schema.customCourses.id, id), eq(schema.customCourses.userId, user.id)));

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};