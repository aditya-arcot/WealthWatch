import { runQuery } from '../utils/database.js'
import { logger } from '../utils/logger.js'

export interface Category {
    id: number
    name: string
}

export const getAllCategories = async (): Promise<Category[]> => {
    logger.debug('getting all categories')
    const query = 'SELECT * FROM categories'
    const rows: Category[] = (await runQuery(query)).rows
    return rows
}
