import { Category } from 'wealthwatch-shared'
import { runQuery } from './index.js'

export const fetchCategories = async (): Promise<Category[]> => {
    const query = `
        SELECT * FROM lookup.categories
        ORDER BY name
    `
    const rows = (await runQuery<DbCategory>(query)).rows
    return rows.map(mapDbCategory)
}

/* eslint-disable @typescript-eslint/naming-convention */
interface DbCategory {
    id: number
    name: string
    group_id: number
}
/* eslint-enable @typescript-eslint/naming-convention */

const mapDbCategory = (dbCategory: DbCategory): Category => ({
    id: dbCategory.id,
    name: dbCategory.name,
    groupId: dbCategory.group_id,
})
