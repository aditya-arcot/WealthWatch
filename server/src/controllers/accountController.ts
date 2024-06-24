import { Request, Response } from 'express'
import { getAllAccounts } from '../models/account.js'
import { ExpressError } from '../models/expressError.js'

export const getAccounts = async (_req: Request, res: Response) => {
    try {
        const accounts = await getAllAccounts()
        return res.send(accounts)
    } catch (error) {
        throw new ExpressError('failed to get accounts', 500)
    }
}
