import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { fetchUserByUsername, insertUser } from '../database/userQueries.js'
import { HttpError } from '../models/httpError.js'
import { User } from '../models/user.js'
import { logger } from '../utils/logger.js'

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in')

    const username = req.body.username
    if (typeof username !== 'string')
        throw new HttpError('missing or invalid username', 400)

    const password = req.body.password
    if (typeof password !== 'string')
        throw new HttpError('missing or invalid password', 400)

    const user = await fetchUserByUsername(username)
    if (!user) {
        throw new HttpError('invalid username', 404)
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
        throw new HttpError('incorrect password', 400)
    }
    req.session.user = user
    return res.send(user)
}

export const logout = (req: Request, res: Response) => {
    logger.debug('logging out')
    req.session.destroy(() => res.status(204).send())
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering')

    const firstName = req.body.firstName
    if (typeof firstName !== 'string')
        throw new HttpError('missing or invalid first name', 400)

    const lastName = req.body.lastName
    if (typeof lastName !== 'string')
        throw new HttpError('missing or invalid last name', 400)

    const username = req.body.username
    if (typeof username !== 'string')
        throw new HttpError('missing or invalid username', 400)

    const email = req.body.email
    if (typeof email !== 'string')
        throw new HttpError('missing or invalid email', 400)

    const password = req.body.password
    if (typeof password !== 'string')
        throw new HttpError('missing or invalid password', 400)

    const passwordHash = bcrypt.hashSync(password)
    const user: User = {
        id: -1,
        username,
        email,
        firstName,
        lastName,
        passwordHash,
    }
    const newUser = await insertUser(user)
    if (!newUser) throw new HttpError('failed to insert user')
    req.session.user = newUser
    return res.status(201).send(newUser)
}
