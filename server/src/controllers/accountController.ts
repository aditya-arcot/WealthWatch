import { Request, Response } from 'express'
import { getAllAccounts } from '../models/account.js'
import { HttpError } from '../models/httpError.js'

export const getAccounts = async (_req: Request, res: Response) => {
    try {
        const accounts = await getAllAccounts()
        return res.send(accounts)
    } catch (error) {
        throw new HttpError('failed to get accounts', 500)
    }
}
