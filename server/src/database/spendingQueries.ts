import {
    CategoryTotalAndCount,
    CategoryTotalByDate,
} from '../models/spending.js'
import { runQuery } from './index.js'

export const fetchTotalAndCountByCategoryWithUserIdAndDateRange = async (
    userId: number,
    startDate?: string,
    endDate?: string
): Promise<CategoryTotalAndCount[]> => {
    let placeholder = 1
    const values: unknown[] = []

    let query = `
        WITH category_amounts AS (
            SELECT
                COALESCE (
                    custom_category_id,
                    category_id
                ) AS category_id,
                amount,
                date
            FROM transactions
            WHERE
                account_id IN (
                    SELECT id
                    FROM accounts
                    WHERE item_id IN (
                        SELECT id
                        FROM active_items
                        WHERE user_id = $${placeholder}
                    )
                )
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
        )
        SELECT
            ca.category_id,
            SUM (ca.amount) AS total,
            COUNT (*) AS count
        FROM category_amounts ca
        GROUP BY ca.category_id
        ORDER BY ca.category_id
    `
    const rows = (await runQuery<DbCategoryTotalAndCount>(query, values)).rows
    return rows.map(mapDbCategoryTotalAndCount)
}

export const fetchTotalByCategoryAndDateWithUserIdAndDates = async (
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
            FROM transactions
            WHERE account_id IN (
                SELECT id
                FROM accounts
                WHERE item_id IN (
                    SELECT id
                    FROM active_items
                    WHERE user_id = $1
                )
            )
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
            WHERE EXISTS (
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
        daily_totals AS (
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
            LEFT JOIN user_transactions ut
                ON fc.category_id = ut.category_id
                AND ut.date >= ds.date
                AND ut.date < (ds.date + INTERVAL '1 day')
            GROUP BY fc.category_id, ds.date
            ORDER BY ds.date
        )
        SELECT
            category_id,
            ARRAY_AGG (total) AS total_by_date
        FROM daily_totals
        GROUP BY category_id
        ORDER BY category_id
    `
    const rows = (await runQuery<DbCategoryTotalByDate>(query, values)).rows
    return rows.map(mapDbCategoryTotalByDate)
}

interface DbCategoryTotalAndCount {
    category_id: number
    total: number
    count: number
}

const mapDbCategoryTotalAndCount = (
    d: DbCategoryTotalAndCount
): CategoryTotalAndCount => ({
    categoryId: d.category_id,
    total: d.total,
    count: d.count,
})

interface DbCategoryTotalByDate {
    category_id: number
    total_by_date: number[]
}

const mapDbCategoryTotalByDate = (
    d: DbCategoryTotalByDate
): CategoryTotalByDate => ({
    categoryId: d.category_id,
    totalByDate: d.total_by_date,
})
