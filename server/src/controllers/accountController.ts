import { Request, Response } from 'express'
import { Account } from '../models/account.js'
import { ExpressError } from '../models/expressError.js'
import { runQuery } from '../utils/database.js'

export const getAccounts = async (_req: Request, res: Response) => {
    const query = 'SELECT * FROM accounts'
    try {
        const rows: Account[] = (await runQuery(query)).rows
        return res.send(rows)
    } catch (error) {
        throw new ExpressError('failed to get accounts', 500)
    }
}
