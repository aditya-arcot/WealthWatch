import { Category } from '../models/category.js'
import { runQuery } from './index.js'

export const fetchCategories = async (): Promise<Category[]> => {
    const query = `
        SELECT * FROM lookup.categories
        ORDER BY name
    `
    const rows = (await runQuery<DbCategory>(query)).rows
    return rows.map(mapDbCategory)
}

interface DbCategory {
    id: number
    name: string
    group_id: number
}

const mapDbCategory = (dbCategory: DbCategory): Category => ({
    id: dbCategory.id,
    name: dbCategory.name,
    groupId: dbCategory.group_id,
})
