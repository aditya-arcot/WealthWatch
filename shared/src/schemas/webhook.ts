/* eslint-disable @typescript-eslint/naming-convention */
import { PlaidWebhook } from '@models'
import * as z from 'zod'

export const ProcessWebhookBodySchema = z.custom<PlaidWebhook>((val) => {
    return typeof val === 'object' && val !== null
})
