import { Request, Response } from 'express'
import { fetchCategories } from '../database/categoryQueries.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getCategories = async (_req: Request, res: Response) => {
    logger.debug('getting categories')

    try {
        const categories = await fetchCategories()
        return res.send(categories)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to get categories')
    }
}
