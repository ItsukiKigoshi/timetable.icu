import type {APIRoute} from 'astro';
import {drizzle} from 'drizzle-orm/d1';
import {and, eq, exists, like, or} from 'drizzle-orm';
import * as schema from '@/db/schema';
import {env} from "cloudflare:workers";
import {limitPerPage} from "@/constants/config.ts";

export const GET: APIRoute = async ({request}) => {
    const db = drizzle(env.timetable_icu, {schema});
    const url = new URL(request.url);

    // クエリパラメータの解析
    const year = url.searchParams.get('year');
    const term = url.searchParams.get('term');
    const q = url.searchParams.get('q') || '';
    const categoryId = url.searchParams.get('categoryId');
    const slots = url.searchParams.get('slots')?.split(',').filter(Boolean) || [];
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

    // 検索条件の構築
    let conditions = [];

    if (year) conditions.push(eq(schema.courses.year, parseInt(year)));
    if (term) conditions.push(eq(schema.courses.term, term as any));

    if (q) {
        const searchVal = `%${q}%`;
        conditions.push(or(
            like(schema.courses.titleJa, searchVal),
            like(schema.courses.titleEn, searchVal),
            like(schema.courses.instructor, searchVal)
        ));
    }

    if (categoryId) {
        conditions.push(exists(
            db.select().from(schema.courseToCategories)
                .where(and(
                    eq(schema.courseToCategories.categoryId, categoryId),
                    eq(schema.courseToCategories.courseId, schema.courses.id)
                ))
        ));
    }

    if (slots.length > 0) {
        slots.forEach(slot => {
            const [day, periodStr] = slot.split('-');
            conditions.push(exists(
                db.select().from(schema.courseSchedules)
                    .where(and(
                        eq(schema.courseSchedules.courseId, schema.courses.id),
                        eq(schema.courseSchedules.dayOfWeek, day as any),
                        eq(schema.courseSchedules.period, parseInt(periodStr))
                    ))
            ));
        });
    }

    // データ取得
    const results = await db.query.courses.findMany({
        where: and(...conditions),
        with: {schedules: true},
        limit: limitPerPage + 1, // 次のページがあるか確認するために1件多く取る
        offset: (page - 1) * limitPerPage,
    });

    const hasNextPage = results.length > limitPerPage;
    // 実際に返すのは20件のみ
    const data = hasNextPage ? results.slice(0, limitPerPage) : results;

    return new Response(JSON.stringify({
        results: data,
        hasNextPage
    }), {
        headers: {"Content-Type": "application/json"}
    });
};