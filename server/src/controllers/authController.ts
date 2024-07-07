import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { User, createUser, fetchUserByUsername } from '../models/user.js'
import { logger } from '../utils/logger.js'

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in user')
    const username: string | undefined = req.body.username
    const password: string | undefined = req.body.password
    if (!username || !password) {
        throw new HttpError('missing username or password', 400)
    }

    const user = await fetchUserByUsername(username)
    if (!user) {
        throw new HttpError("user doesn't exist", 404)
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
        throw new HttpError('incorrect password', 400)
    }

    logger.debug(user, 'login success')
    req.session.user = user
    return res.json(user)
}

export const logout = (req: Request, res: Response) => {
    logger.debug('logging out user')
    req.session.destroy((err) => {
        if (err) {
            throw new HttpError('failed to log out')
        }
        return res.status(200).send()
    })
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering user')
    const user: User = {
        id: 0, // will be set by database
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
    }

    const newUser = await createUser(user)
    if (!newUser) {
        throw new HttpError('failed to create user')
    }

    logger.debug(newUser, 'register success')
    req.session.user = newUser
    return res.status(201).json(newUser)
}
