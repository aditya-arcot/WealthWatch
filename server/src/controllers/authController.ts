import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { fetchUserByUsername, insertUser } from '../database/userQueries.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in')

    const username: string | undefined = req.body.username
    const password: string | undefined = req.body.password

    if (!username || !password) {
        throw new HttpError('missing username or password', 400)
    }

    try {
        const user = await fetchUserByUsername(username)
        if (!user) {
            throw new HttpError('incorrect username', 404)
        }
        if (!bcrypt.compareSync(password, user.passwordHash)) {
            throw new HttpError('incorrect password', 400)
        }
        req.session.user = user
        return res.send(user)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to log in')
    }
}

export const logout = (req: Request, res: Response) => {
    logger.debug('logging out')
    req.session.destroy((err) => {
        if (err) {
            throw Error('failed to log out')
        }
        return res.status(204).send()
    })
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering')

    const username = req.body.username
    const email = req.body.email
    const firstName = req.body.firstName
    const lastName = req.body.lastName
    const password = req.body.password

    if (!username || !email || !firstName || !lastName || !password) {
        throw new HttpError('missing user info', 400)
    }

    try {
        const passwordHash = bcrypt.hashSync(password)
        const user = await insertUser(
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
        throw Error('failed to register')
    }
}
