import type {APIRoute} from "astro";
import {drizzle} from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import {env} from "cloudflare:workers";
import {sql} from "drizzle-orm";

export const POST: APIRoute = async (context) => {
    const user = context.locals.user;

    if (!user) {
        return new Response(JSON.stringify({error: "Unauthorized"}), {status: 401});
    }

    try {
        const body = await context.request.json() as { courseItems: any[] };
        const rawItems = Array.isArray(body?.courseItems) ? body.courseItems : [];

        const db = drizzle(env.timetable_icu, {schema});

        // 1. データの正規化（メタデータを保持したまま重複排除）
        const itemMap = new Map<number, any>();
        rawItems.forEach(item => {
            const id = Number(item.courseId || item.id);
            if (!isNaN(id) && id > 0) {
                itemMap.set(id, item);
            }
        });

        if (itemMap.size === 0) {
            return new Response(JSON.stringify({success: true, syncedCount: 0}), {status: 200});
        }

        // 2. 挿入データの作成
        const insertValues = Array.from(itemMap.values()).map(item => ({
            userId: user.id,
            courseId: Number(item.courseId || item.id),
            isVisible: item.isVisible !== false, // デフォルト true
            memo: item.memo || null,
            colorCustom: item.colorCustom || null,
        }));

        // 3. 実行（競合時はメタデータを更新）
        await db.insert(schema.userCourses)
            .values(insertValues)
            .onConflictDoUpdate({
                target: [schema.userCourses.userId, schema.userCourses.courseId],
                set: {
                    isVisible: sql`excluded
                    .
                    is_visible`,
                    memo: sql`excluded
                    .
                    memo`,
                    colorCustom: sql`excluded
                    .
                    color_custom`
                }
            });

        return new Response(JSON.stringify({
            success: true,
            syncedCount: insertValues.length
        }), {status: 200});
    } catch (e: any) {
        console.error("Sync Error:", e);
        return new Response(JSON.stringify({
            error: e.message || "Sync failed",
            detail: e.cause?.message || String(e)
        }), {status: 500});
    }
};