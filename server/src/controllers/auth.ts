import {
    fetchAccessRequestByAccessCode,
    fetchAccessRequestByEmail,
    fetchUserByEmail,
    fetchUserByUsername,
    insertAccessRequest,
    insertUser,
    modifyAccessRequestStatusById,
} from '@database'
import { HttpError } from '@models'
import { createCookieName, logger, validate, vars } from '@utilities'
import {
    AccessRequest,
    AccessRequestErrorCodeEnum,
    AccessRequestStatusEnum,
    LoginBodySchema,
    RegisterBodySchema,
    RequestAccessBodySchema,
    User,
    ValidateAccessCodeBodySchema,
} from '@wealthwatch-shared'
import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'

export const requestAccess = async (req: Request, res: Response) => {
    logger.debug('requesting access')

    const body = validate(req.body, RequestAccessBodySchema)

    const emailExists = !!(await fetchUserByEmail(body.email))
    if (emailExists)
        throw new HttpError(
            'user exists',
            409,
            AccessRequestErrorCodeEnum.UserExists
        )

    const existingAccessReq = await fetchAccessRequestByEmail(body.email)
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
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        statusId: AccessRequestStatusEnum.Pending,
        accessCode: null,
        reviewer: null,
        createTimestamp: new Date(),
        updateTimestamp: new Date(),
    }
    await insertAccessRequest(accessReq)

    res.status(204).send()
}

export const validateAccessCode = async (req: Request, res: Response) => {
    logger.debug('validating access code')

    const body = validate(req.body, ValidateAccessCodeBodySchema)

    const accessReq = await fetchAccessRequestByAccessCode(body.accessCode)
    if (!accessReq) throw new HttpError('invalid access code', 400)
    if (accessReq.statusId !== AccessRequestStatusEnum.Approved)
        throw new HttpError('invalid access code', 400)

    res.json({
        name: `${accessReq.firstName} ${accessReq.lastName}`,
        email: accessReq.email,
    })
}

export const register = async (req: Request, res: Response) => {
    logger.debug('registering')

    const body = validate(req.body, RegisterBodySchema)

    const accessReq = await fetchAccessRequestByAccessCode(body.accessCode)
    if (!accessReq) throw new HttpError('invalid access code', 400)

    if (accessReq.statusId !== AccessRequestStatusEnum.Approved) {
        throw new HttpError('invalid access code', 400)
    }

    const email = accessReq.email
    const firstName = accessReq.firstName
    const lastName = accessReq.lastName

    const emailExists = !!(await fetchUserByEmail(email))
    const usernameExists = !!(await fetchUserByUsername(body.username))
    if (emailExists || usernameExists) {
        throw new HttpError(
            'a user with this email or username already exists',
            409
        )
    }

    const passwordHash = bcrypt.hashSync(body.password)
    const user: User = {
        id: -1,
        username: body.username,
        email,
        firstName,
        lastName,
        passwordHash,
        admin: false,
    }
    const newUser = await insertUser(user)

    void regenerateSession(req).then(async () => {
        req.session.user = {
            id: newUser.id,
            username: newUser.username,
            admin: newUser.admin,
        }

        await modifyAccessRequestStatusById(
            accessReq.id,
            AccessRequestStatusEnum.Completed
        )
        res.status(201).json(newUser)
    })
}

export const login = async (req: Request, res: Response) => {
    logger.debug('logging in')

    const body = validate(req.body, LoginBodySchema)

    const user = await fetchUserByUsername(body.username)
    if (!user) throw new HttpError('invalid username', 404)
    if (!bcrypt.compareSync(body.password, user.passwordHash))
        throw new HttpError('incorrect password', 400)

    void regenerateSession(req).then(() => {
        req.session.user = {
            id: user.id,
            username: user.username,
            admin: user.admin,
        }
        res.json(user)
    })
}

export const loginWithDemo = async (req: Request, res: Response) => {
    logger.debug('logging in with demo account')

    const user = await fetchUserByUsername(vars.demoUser)
    if (!user) {
        throw new HttpError('demo user not found', 404)
    }

    void regenerateSession(req).then(() => {
        req.session.user = {
            id: user.id,
            username: user.username,
            admin: user.admin,
        }
        res.json(user)
    })
}

const regenerateSession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) {
                reject(err instanceof Error ? err : new Error(String(err)))
                return
            }
            resolve()
        })
    })
}

export const logout = (req: Request, res: Response) => {
    logger.debug('logging out')
    req.session.destroy(() => {
        res.clearCookie(createCookieName('session'))
        res.clearCookie(createCookieName('csrf'))
        res.status(204).send()
    })
}
