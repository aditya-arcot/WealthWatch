import { Request, Response } from 'express'
import { ExpressError } from '../models/expressError.js'
import { User } from '../models/user.js'
import { runQuery } from '../utils/database.js'

export const getUsers = async (_req: Request, res: Response) => {
    const query = 'SELECT * FROM users'
    try {
        const rows: User[] = (await runQuery(query)).rows
        return res.send(rows)
    } catch (error) {
        throw new ExpressError('failed to get users', 500)
    }
}
