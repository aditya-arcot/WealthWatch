import {
    AccessRequest,
    AccessRequestErrorCodeEnum,
    AccessRequestStatusEnum,
    User,
} from '@wealthwatch-shared'
import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import {
    fetchAccessRequestByAccessCode,
    fetchAccessRequestByEmail,
    insertAccessRequest,
    modifyAccessRequestStatusById,
} from '../database/accessRequestQueries.js'
import {
    fetchUserByEmail,
    fetchUserByUsername,
    insertUser,
} from '../database/userQueries.js'
import { HttpError } from '../models/error.js'
import { vars } from '../utilities/env.js'
import { logger } from '../utilities/logger.js'
import { createCookieName } from '../utilities/string.js'

export const requestAccess = async (req: Request, res: Response) => {
    logger.debug('requesting access')

    const firstName = req.body.firstName
    if (typeof firstName !== 'string')
        throw new HttpError('missing or invalid first name', 400)

    const lastName = req.body.lastName
    if (typeof lastName !== 'string')
        throw new HttpError('missing or invalid last name', 400)

    const email = req.body.email
    if (typeof email !== 'string')
        throw new HttpError('missing or invalid email', 400)

    const emailExists = !!(await fetchUserByEmail(email))
    if (emailExists)
        throw new HttpError(
            'user exists',
            409,
            AccessRequestErrorCodeEnum.UserExists
        )

    const existingAccessReq = await fetchAccessRequestByEmail(email)
    if (existingAccessReq) {
        switch (existingAccessReq.statusId) {
            case AccessRequestStatusEnum.Pending:
                throw new HttpError(
                    'access request pending',
                    409,
                    AccessRequestErrorCodeEnum.RequestPending
                )
            case AccessRequestStatusEnum.Approved:
                throw new HttpError(
                    'access request approved',
                    409,
                    AccessRequestErrorCodeEnum.RequestApproved
                )
            case AccessRequestStatusEnum.Rejected:
                throw new HttpError(
                    'access request rejected',
                    409,
                    AccessRequestErrorCodeEnum.RequestRejected
                )
            default:
                throw new HttpError(
                    'user exists',
                    409,
                    AccessRequestErrorCodeEnum.UserExists
                )
        }
    }

    const accessReq: AccessRequest = {
        id: -1,
        firstName,
        lastName,
        email,
        statusId: AccessRequestStatusEnum.Pending,
        accessCode: null,
        reviewer: null,
        createTimestamp: new Date(),
        updateTimestamp: new Date(),
    }
    await insertAccessRequest(accessReq)
    return res.status(204).send()
}

export const validateAccessCode = async (req: Request, res: Response) => {
    logger.debug('validating access code')

    const accessCode = req.body.accessCode
    if (typeof accessCode !== 'string')
        throw new HttpError('missing or invalid access code', 400)

    const accessReq = await fetchAccessRequestByAccessCode(accessCode)
    if (!accessReq) throw new HttpError('invalid access code', 400)

    if (accessReq.statusId !== AccessRequestStatusEnum.Approved) {
        throw new HttpError('invalid access code', 400)
    }

    return res.json({
        name: `${accessReq.firstName} ${accessReq.lastName}`,
        email: accessReq.email,
    })
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering')

    const accessCode = req.body.accessCode
    if (typeof accessCode !== 'string')
        throw new HttpError('missing or invalid access code', 400)

    const username = req.body.username
    if (typeof username !== 'string')
        throw new HttpError('missing or invalid username', 400)

    const password = req.body.password
    if (typeof password !== 'string')
        throw new HttpError('missing or invalid password', 400)

    const accessReq = await fetchAccessRequestByAccessCode(accessCode)
    if (!accessReq) throw new HttpError('invalid access code', 400)

    if (accessReq.statusId !== AccessRequestStatusEnum.Approved) {
        throw new HttpError('invalid access code', 400)
    }

    const email = accessReq.email
    const firstName = accessReq.firstName
    const lastName = accessReq.lastName

    const emailExists = !!(await fetchUserByEmail(email))
    const usernameExists = !!(await fetchUserByUsername(username))
    if (emailExists || usernameExists) {
        throw new HttpError(
            'a user with this email or username already exists',
            409
        )
    }

    const passwordHash = bcrypt.hashSync(password)
    const user: User = {
        id: -1,
        username,
        email,
        firstName,
        lastName,
        passwordHash,
        admin: false,
    }
    const newUser = await insertUser(user)
    req.session.user = newUser

    await modifyAccessRequestStatusById(
        accessReq.id,
        AccessRequestStatusEnum.Completed
    )
    return res.status(201).json(newUser)
}

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
    return res.json(user)
}

export const loginWithDemo = async (req: Request, res: Response) => {
    logger.debug('logging in with demo account')

    const user = await fetchUserByUsername(vars.demoUser)
    if (!user) {
        throw new HttpError('demo user not found', 404)
    }
    req.session.user = user
    return res.json(user)
}

export const logout = (req: Request, res: Response) => {
    logger.debug('logging out')
    req.session.destroy(() => {
        res.clearCookie(createCookieName('csrf'))
        res.status(204).send()
    })
}
