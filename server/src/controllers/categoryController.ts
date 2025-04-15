import { Request, Response } from 'express'
import { fetchCategories } from '../database/categoryQueries.js'
import { logger } from '../utilities/logger.js'

export const getCategories = async (_req: Request, res: Response) => {
    logger.debug('getting categories')
    const categories = await fetchCategories()
    return res.json(categories)
}
