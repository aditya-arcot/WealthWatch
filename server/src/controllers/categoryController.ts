import { Request, Response } from 'express'
import { getAllCategories } from '../models/category.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getCategories = async (_req: Request, res: Response) => {
    logger.debug('getting categories')
    try {
        const categories = await getAllCategories()
        return res.send(categories)
    } catch (error) {
        throw new HttpError('failed to get categories', 500)
    }
}
