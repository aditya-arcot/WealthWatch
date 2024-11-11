import { Request, Response } from 'express'
import {
    fetchActiveCreditCardLiabilitiesWithUserId,
    fetchActiveMortgageLiabilitiesWithUserId,
    fetchActiveStudentLoanLiabilitiesWithUserId,
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

    const liabilities = await fetchActiveCreditCardLiabilitiesWithUserId(userId)
    return res.json(liabilities)
}

export const getUserMortgageLiabilities = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting mortgage liabilities')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const liabilities = await fetchActiveMortgageLiabilitiesWithUserId(userId)
    return res.json(liabilities)
}

export const getUserStudentLoanLiabilities = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting student loan liabilities')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const liabilities =
        await fetchActiveStudentLoanLiabilitiesWithUserId(userId)
    return res.json(liabilities)
}
