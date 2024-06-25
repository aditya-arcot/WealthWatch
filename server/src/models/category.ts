import { runQuery } from '../utils/database.js'

export interface Category {
    id: number
    name: string
}

export const fetchCategories = async (): Promise<Category[]> => {
    const query = 'SELECT * FROM categories'
    const rows: Category[] = (await runQuery(query)).rows
    return rows
}
