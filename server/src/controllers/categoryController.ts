import { fetchCategories } from '@database/categoryQueries.js'
import { logger } from '@utilities/logger.js'
import { Request, Response } from 'express'

export const getCategories = async (_req: Request, res: Response) => {
    logger.debug('getting categories')
    const categories = await fetchCategories()
    return res.json(categories)
}
