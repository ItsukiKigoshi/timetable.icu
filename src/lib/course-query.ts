import {and, eq, exists, like, or} from 'drizzle-orm';
import * as schema from '@/db/schema.ts';
import type {DrizzleD1Database} from 'drizzle-orm/d1';
import type {SearchFilters} from "@/components/ExploreInterface.tsx";

// Create DB filters from query parameters
export function getCourseSearchConfig(url: URL, db: DrizzleD1Database<typeof schema>) {
    const year = url.searchParams.get('year') || url.searchParams.get('year');
    const term = url.searchParams.get('term');
    const q = url.searchParams.get('q') || '';
    // Explore.astro(category) と API(categoryId) の両方のパラメータ名に対応
    const categoryId = url.searchParams.get('categoryId') || url.searchParams.get('category');
    const slots = url.searchParams.get('slots')?.split(',').filter(Boolean) || [];
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

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
        } satisfies SearchFilters
    };
}