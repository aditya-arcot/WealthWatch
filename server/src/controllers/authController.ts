import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { fetchUserByUsername, insertUser } from '../database/userQueries.js'
import { HttpError } from '../models/httpError.js'
import { User } from '../models/user.js'
import { logger } from '../utils/logger.js'

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in')

    const username: string | undefined = req.body.username
    const password: string | undefined = req.body.password

    if (username === undefined || password === undefined) {
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

    const username: string | undefined = req.body.username
    const email: string | undefined = req.body.email
    const firstName: string | undefined = req.body.firstName
    const lastName: string | undefined = req.body.lastName
    const password: string | undefined = req.body.password

    if (
        username === undefined ||
        email === undefined ||
        firstName === undefined ||
        lastName === undefined ||
        password === undefined
    ) {
        throw new HttpError('missing user info', 400)
    }

    try {
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
        if (!newUser) throw Error('user not created')
        req.session.user = newUser
        return res.status(201).send(newUser)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to register')
    }
}
