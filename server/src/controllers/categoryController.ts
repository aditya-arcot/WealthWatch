import { Request, Response } from 'express'
import { getAllCategories } from '../models/category.js'
import { HttpError } from '../models/httpError.js'

export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await getAllCategories()
        return res.send(categories)
    } catch (error) {
        throw new HttpError('failed to get categories', 500)
    }
}
