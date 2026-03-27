import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import {env} from "cloudflare:workers";


export const POST: APIRoute = async (context) => {
    // Astroのlocalsからユーザーを取得
    const user = context.locals.user;
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { courseIds } = (await context.request.json()) as { courseIds: number[] };

        const db = drizzle(env.timetable_icu, { schema });

        const values = courseIds.map(id => ({
            userId: user.id,
            courseId: id,
        }));

        if (values.length > 0) {
            await db.insert(schema.userCourses)
                .values(values)
                .onConflictDoNothing();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Sync Error:", e); // サーバーログで原因を特定しやすくする
        return new Response(JSON.stringify({ error: e.message || "Sync failed" }), { status: 500 });
    }
};