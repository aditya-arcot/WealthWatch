import { Request, Response } from 'express'
import { ExpressError } from '../models/expressError.js'
import { Transaction } from '../models/transaction.js'
import { runQuery } from '../utils/database.js'

export const getTransactions = async (_req: Request, res: Response) => {
    const query = 'SELECT * FROM transactions'
    try {
        const rows: Transaction[] = (await runQuery(query)).rows
        return res.send(rows)
    } catch (error) {
        throw new ExpressError('failed to get transactions', 500)
    }
}
