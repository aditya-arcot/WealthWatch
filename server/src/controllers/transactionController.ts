import { Request, Response } from 'express'
import { ExpressError } from '../models/expressError.js'
import { getAllTransactions } from '../models/transaction.js'

export const getTransactions = async (_req: Request, res: Response) => {
    try {
        const transactions = await getAllTransactions()
        return res.send(transactions)
    } catch (error) {
        throw new ExpressError('failed to get transactions', 500)
    }
}
