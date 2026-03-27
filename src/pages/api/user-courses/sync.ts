import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async (context) => {
    const user = context.locals.user;

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await context.request.json() as Record<string, any>;
        const rawIds = Array.isArray(body?.courseIds) ? body.courseIds : [];

        // 1. データの正規化
        // localStorage 内でスケジュールがある授業は "courseId",
        // スケジュールがない授業は直接 "id" というキーで管理されているケースに対応
        const validIds = Array.from(new Set(
            rawIds
                .map(item => {
                    // item がオブジェクトの場合と数値の場合の両方を考慮
                    const val = typeof item === 'object' && item !== null
                        ? (item.courseId || item.id)
                        : item;
                    const num = Number(val);
                    return isNaN(num) ? null : num;
                })
                .filter((id): id is number => id !== null && id > 0)
        ));

        if (validIds.length === 0) {
            return new Response(JSON.stringify({ success: true, syncedCount: 0 }), { status: 200 });
        }

        const db = drizzle(env.timetable_icu, { schema });

        // 2. 挿入データの作成
        // ログの `(null, ?, ?, ...)` を防ぐため、drizzleのスキーマ定義に従い
        // 自動採番される 'id' やデフォルト値のある 'createdAt' はオブジェクトに含めない
        const insertValues = validIds.map(courseId => ({
            userId: user.id,
            courseId: courseId,
        }));

        // 3. 実行
        await db.insert(schema.userCourses)
            .values(insertValues)
            .onConflictDoNothing();

        return new Response(JSON.stringify({
            success: true,
            syncedCount: insertValues.length
        }), { status: 200 });

    } catch (e: any) {
        console.error("Sync Error:", e);
        return new Response(JSON.stringify({
            error: e.message || "Sync failed",
            detail: e.cause?.message || String(e)
        }), { status: 500 });
    }
};