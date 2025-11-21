import { refreshItemInvestments } from '@controllers'
import {
    fetchActiveItemsByUserId,
    modifyItemInvestmentsLastRefreshedByPlaidId,
} from '@database'
import { HttpError } from '@models'
import { logger } from '@utilities'
import { Request, Response } from 'express'

export const refreshUserInvestments = async (req: Request, res: Response) => {
    logger.debug('refreshing investments')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsByUserId(userId)
    await Promise.all(
        items.map(async (item) => {
            if (await refreshItemInvestments(item)) {
                await modifyItemInvestmentsLastRefreshedByPlaidId(
                    item.plaidId,
                    new Date()
                )
            }
        })
    )

    return res.status(204).send()
}
