import { Request, Response } from 'express'
import { Category } from '../models/category.js'
import { ExpressError } from '../models/expressError.js'
import { runSelectQuery } from '../utils/database.js'

export const getCategories = async (_req: Request, res: Response) => {
    const query = 'SELECT * FROM categories'
    try {
        const rows: Category[] = await runSelectQuery(query)
        return res.send(rows)
    } catch (error) {
        throw new ExpressError('failed to get categories', 500)
    }
}
