import type {APIRoute} from 'astro';
import {drizzle} from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import {env} from "cloudflare:workers";
import {limitPerPage} from "@/constants/config.ts";
import {getCourseSearchConfig} from "@/lib/course-query.ts";

export const GET: APIRoute = async ({request}) => {
    const db = drizzle(env.timetable_icu, {schema});
    const {where, page} = getCourseSearchConfig(new URL(request.url), db);

    const results = await db.query.courses.findMany({
        where,
        with: {schedules: true},
        limit: limitPerPage + 1,
        offset: (page - 1) * limitPerPage,
    });

    const hasNextPage = results.length > limitPerPage;
    const data = hasNextPage ? results.slice(0, limitPerPage) : results;

    return new Response(JSON.stringify({results: data, hasNextPage}), {
        headers: {"Content-Type": "application/json"}
    });
};