import { fetchCategories } from '@database'
import { logger } from '@utilities'
import { Request, Response } from 'express'

export const getCategories = async (_req: Request, res: Response) => {
    logger.debug('getting categories')
    const categories = await fetchCategories()
    res.json(categories)
}
