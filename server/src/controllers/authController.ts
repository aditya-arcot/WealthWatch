import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { ExpressError } from '../models/expressError.js'
import { User, createUser, getUserByUsername } from '../models/user.js'
import { logger } from '../utils/logger.js'

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in user')
    const username: string | undefined = req.body.username
    const password: string | undefined = req.body.password
    if (!username || !password) {
        throw new ExpressError('missing username or password', 400)
    }

    const user = await getUserByUsername(username)
    if (!user) {
        throw new ExpressError('user not found', 404)
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
        throw new ExpressError('invalid username or password', 400)
    }

    logger.debug(user, 'login success')
    req.session.user = user
    return res.json(user)
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering user')
    const user: User = {
        id: 0, // will be set by database
        username: req.body.username,
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password_hash: bcrypt.hashSync(req.body.password, 10),
    }

    const newUser = await createUser(user)
    if (!newUser) {
        throw new ExpressError('user not found', 404)
    }

    logger.debug(newUser, 'register success')
    req.session.user = newUser
    return res.status(201).json(newUser)
}
