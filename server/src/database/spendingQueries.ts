import { CategorySummary, CategoryTotalByDate } from '../models/spending.js'
import { runQuery } from './index.js'

export const fetchCategorySummariesByUserIdAndDateRange = async (
    userId: number,
    startDate?: string,
    endDate?: string
): Promise<CategorySummary[]> => {
    let placeholder = 1
    const values: unknown[] = []

    let query = `
        WITH category_id_amount_date AS (
            SELECT
                COALESCE (
                    custom_category_id,
                    category_id
                ) AS category_id,
                amount,
                date
            FROM active_transactions
            WHERE user_id = $${placeholder}
    `
    values.push(userId)
    placeholder++

    if (startDate !== undefined && endDate !== undefined) {
        query += `
            AND date >= $${placeholder}
            AND date < ($${placeholder + 1}::TIMESTAMPTZ + INTERVAL '1 day')
        `
        values.push(startDate)
        values.push(endDate)
        placeholder += 2
    } else if (startDate !== undefined) {
        query += `
            AND date >= $${placeholder}
        `
        values.push(startDate)
        placeholder++
    } else if (endDate !== undefined) {
        query += `
            AND date < ($${placeholder}::TIMESTAMPTZ + INTERVAL '1 day')
        `
        values.push(endDate)
        placeholder++
    }

    query += `
        ),
        category_id_total_count AS (
            SELECT
                category_id,
                SUM (amount) AS total,
                COUNT (*) AS count
            FROM category_id_amount_date
            GROUP BY category_id
        )
        SELECT
            citc.*
        FROM category_id_total_count citc
        JOIN categories c
            ON c.id = citc.category_id
        ORDER BY c.group_id, c.id
    `
    const rows = (await runQuery<DbCategorySummary>(query, values)).rows
    return rows.map(mapDbCategorySummary)
}

export const fetchCategoryTotalsByDateWithUserIdAndDateRange = async (
    userId: number,
    startDate?: string,
    endDate?: string
): Promise<CategoryTotalByDate[]> => {
    const values: unknown[] = []

    let query = `
        WITH user_transactions AS (
            SELECT
                COALESCE (
                    custom_category_id,
                    category_id
                ) AS category_id,
                date,
                amount
            FROM active_transactions
            WHERE user_id = $1
        ),
        date_series AS (
            SELECT GENERATE_SERIES (
    `
    values.push(userId)

    if (startDate === undefined && endDate === undefined) {
        query += `
                (SELECT MIN (date) FROM user_transactions),
                (SELECT MAX (date) FROM user_transactions),
        `
    } else if (startDate === undefined) {
        query += `
                DATE_TRUNC ('day', (SELECT MIN (date) FROM user_transactions))
                    - INTERVAL '1 day'
                    + ($2::TIMESTAMPTZ - DATE_TRUNC ('day', $2::TIMESTAMPTZ)),
                $2::TIMESTAMPTZ,
        `
        values.push(endDate)
    } else if (endDate === undefined) {
        query += `
                $2::TIMESTAMPTZ,
                NOW (),
        `
        values.push(startDate)
    } else {
        query += `
                $2::TIMESTAMPTZ,
                $3::TIMESTAMPTZ,
        `
        values.push(startDate)
        values.push(endDate)
    }

    query += `
                INTERVAL '1 day'
            ) AS date
        ),
        filtered_categories AS (
            SELECT c.id as category_id
            FROM categories c
            JOIN category_groups cg
                ON cg.id = c.group_id
            WHERE 
                LOWER (cg.name) = 'spending' 
                AND EXISTS (
                    SELECT 1
                    FROM user_transactions ut
                    WHERE
                        c.id = ut.category_id
    `

    if (startDate !== undefined) {
        query += `
                        AND ut.date >= $2::TIMESTAMPTZ
        `
    }

    if (endDate !== undefined) {
        const placeholder = startDate !== undefined ? 3 : 2
        query += `
                        AND ut.date < ($${placeholder}::TIMESTAMPTZ + INTERVAL '1 day')
        `
    }

    query += `
                )
        ),
        category_id_date_total AS (
            SELECT
                fc.category_id,
                ds.date,
                SUM (
                    CASE
                        WHEN fc.category_id = ut.category_id
                        THEN ut.amount
                        ELSE 0
                    END
                ) AS total
            FROM date_series ds
            CROSS JOIN filtered_categories fc
            JOIN user_transactions ut
                ON fc.category_id = ut.category_id
                AND ut.date >= ds.date
                AND ut.date < (ds.date + INTERVAL '1 day')
            GROUP BY fc.category_id, ds.date
        )
        SELECT
            category_id,
            JSON_AGG (
                JSON_BUILD_OBJECT (
                    'date', 
                    TO_CHAR (
                        date AT TIME ZONE 'UTC', 
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ), 
                    'total', 
                    total
                )
                ORDER BY date
            ) AS total_by_date
        FROM category_id_date_total
        GROUP BY category_id
        ORDER BY category_id
    `
    const rows = (await runQuery<DbCategoryTotalByDate>(query, values)).rows
    return rows.map(mapDbCategoryTotalByDate)
}

interface DbCategorySummary {
    category_id: number
    total: number
    count: number
}

const mapDbCategorySummary = (d: DbCategorySummary): CategorySummary => ({
    categoryId: d.category_id,
    total: d.total,
    count: d.count,
})

interface DbCategoryTotalByDate {
    category_id: number
    total_by_date: [
        {
            date: string
            total: number
        },
    ]
}

const mapDbCategoryTotalByDate = (
    d: DbCategoryTotalByDate
): CategoryTotalByDate => ({
    categoryId: d.category_id,
    totalByDate: d.total_by_date,
})
