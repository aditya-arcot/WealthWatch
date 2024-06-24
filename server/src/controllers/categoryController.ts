import { Request, Response } from 'express'
import { getAllCategories } from '../models/category.js'
import { ExpressError } from '../models/expressError.js'

export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await getAllCategories()
        return res.send(categories)
    } catch (error) {
        throw new ExpressError('failed to get categories', 500)
    }
}
