import { Request, Response } from 'express'
import { ExpressError } from '../models/expressError.js'
import { User } from '../models/user.js'
import { runSelectQuery } from '../utils/database.js'

export const getUsers = async (_req: Request, res: Response) => {
    const query = 'SELECT * FROM users'
    try {
        const rows: User[] = await runSelectQuery(query)
        return res.send(rows)
    } catch (error) {
        throw new ExpressError('failed to get users', 500)
    }
}
