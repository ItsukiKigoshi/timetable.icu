import {and, eq, exists, gte, isNull, like, lte, or} from 'drizzle-orm';
import * as schema from '@/db/schema';
import type {DrizzleD1Database} from 'drizzle-orm/d1';
import type {SearchFilters} from "@/components/features/ExploreInterface.tsx";

// Create DB filters from URL query parameters
export function getCourseSearchConfig(url: URL, db: DrizzleD1Database<typeof schema>) {
    const year = url.searchParams.get('year') || url.searchParams.get('year');
    const term = url.searchParams.get('term');
    const q = url.searchParams.get('q') || '';
    const categoryId = url.searchParams.get('categoryId') || null;
    const slots = url.searchParams.get('slots')?.split(',').filter(Boolean) || [];
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const language = url.searchParams.get('language');
    const units = url.searchParams.get('units');

    let conditions = [];

    if (year) conditions.push(eq(schema.courses.year, parseInt(year)));
    if (term) conditions.push(eq(schema.courses.term, term as any));

    // cancelされていないコースのみ検索可能
    conditions.push(eq(schema.courses.status, "active"));

    if (q) {
        const searchVal = `%${q}%`;
        conditions.push(or(
            like(schema.courses.rgNo, searchVal),
            like(schema.courses.courseCode, searchVal),
            like(schema.courses.titleJa, searchVal),
            like(schema.courses.titleEn, searchVal),
            like(schema.courses.instructor, searchVal),
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

    if (units) {
        const u = parseFloat(units);
        if (u < 1) {
            // 小数の場合は誤差を考慮（0.333...対策）
            conditions.push(and(
                gte(schema.courses.units, u - 0.01),
                lte(schema.courses.units, u + 0.01)
            ));
        } else {
            // 整数の場合は完全一致
            conditions.push(eq(schema.courses.units, u));
        }
    }
    if (language) {
        if (language === 'null') {
            // "指定なし" が選択された場合、IS NULL または 空文字 を探す
            conditions.push(or(
                isNull(schema.courses.language),
                eq(schema.courses.language, "")
            ));
        } else {
            // E, J, O などが選択された場合
            conditions.push(eq(schema.courses.language, language));
        }
    }

    return {
        where: and(...conditions),
        page,
        filters: {
            year: url.searchParams.get('year'),
            term: url.searchParams.get('term'),
            q: url.searchParams.get('q') || '',
            categoryId: url.searchParams.get('category') || url.searchParams.get('categoryId'),
            slots: url.searchParams.get('slots')?.split(',').filter(Boolean) || [],
            page: Math.max(1, parseInt(url.searchParams.get('page') || '1')),
            day: url.searchParams.get('day') || null,
            period: url.searchParams.get('period') || null,
            isLong: url.searchParams.get('isLong') || null,
            units: units || null,
            language: language || null,
        } satisfies SearchFilters
    };
}