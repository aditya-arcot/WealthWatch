import { Category } from '../models/category.js'
import { runQuery } from './index.js'

export const fetchCategories = async (): Promise<Category[]> => {
    const query = 'SELECT * FROM categories'
    return (await runQuery<Category>(query)).rows
}
