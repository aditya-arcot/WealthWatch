import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { createUser, retrieveUserByUsername } from '../models/user.js'
import { logger } from '../utils/logger.js'

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in user')

    const username: string | undefined = req.body.username
    const password: string | undefined = req.body.password

    if (!username || !password) {
        throw new HttpError('missing username or password', 400)
    }

    try {
        const user = await retrieveUserByUsername(username)
        if (!user) {
            throw new HttpError('no matching user', 404)
        }
        if (!bcrypt.compareSync(password, user.passwordHash)) {
            throw new HttpError('incorrect password', 400)
        }
        req.session.user = user
        return res.send(user)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to login')
    }
}

export const logout = (req: Request, res: Response) => {
    logger.debug('logging out user')
    req.session.destroy((err) => {
        if (err) {
            throw new HttpError('failed to log out')
        }
        return res.send()
    })
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering user')

    const username = req.body.username
    const email = req.body.email
    const firstName = req.body.firstName
    const lastName = req.body.lastName
    const password = req.body.password

    if (!username || !email || !firstName || !lastName || !password) {
        throw new HttpError('missing user info', 400)
    }

    const passwordHash = bcrypt.hashSync(password)

    try {
        const user = await createUser(
            username,
            email,
            firstName,
            lastName,
            passwordHash
        )
        if (!user) throw Error('user not created')
        req.session.user = user
        return res.status(201).send(user)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to register')
    }
}
