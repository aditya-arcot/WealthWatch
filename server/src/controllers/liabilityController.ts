import { Request, Response } from 'express'
import {
    fetchActiveCreditCardLiabilitiesByUserId,
    fetchActiveMortgageLiabilitiesByUserId,
    fetchActiveStudentLoanLiabilitiesByUserId,
} from '../database/liabilityQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utils/logger.js'

export const getUserCreditCardLiabilities = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting credit card liabilities')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const resp = await fetchActiveCreditCardLiabilitiesByUserId(userId)
    return res.json(resp)
}

export const getUserMortgageLiabilities = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting mortgage liabilities')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const resp = await fetchActiveMortgageLiabilitiesByUserId(userId)
    return res.json(resp)
}

export const getUserStudentLoanLiabilities = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting student loan liabilities')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const resp = await fetchActiveStudentLoanLiabilitiesByUserId(userId)
    return res.json(resp)
}
