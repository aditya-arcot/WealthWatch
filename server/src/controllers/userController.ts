import { Request, Response } from 'express'
import { ExpressError } from '../models/expressError.js'
import { getAllUsers } from '../models/user.js'

export const getUsers = async (_req: Request, res: Response) => {
    try {
        const users = await getAllUsers()
        return res.send(users)
    } catch (error) {
        throw new ExpressError('failed to get users', 500)
    }
}
