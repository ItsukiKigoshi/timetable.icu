import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import {env} from "cloudflare:workers";

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return new Response(null, { status: 401 });

    try {
        const { courseIds } = (await request.json()) as { courseIds: number[] };
        if (!courseIds || courseIds.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No data" }));
        }

        const db = drizzle(env.timetable_icu, { schema });

        // 1件ずつ INSERT (ON CONFLICT DO NOTHINGで重複回避)
        // D1でより高速に処理したい場合は db.batch を検討してください
        for (const id of courseIds) {
            await db.insert(schema.userCourses).values({
                userId: user.id,
                courseId: id,
            }).onConflictDoNothing();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Sync failed" }), { status: 500 });
    }
};