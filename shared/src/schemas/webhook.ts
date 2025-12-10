/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'
import { PlaidWebhook } from '../models/index.js'

export const ProcessWebhookBodySchema = z.custom<PlaidWebhook>((val) => {
    return typeof val === 'object' && val !== null
})
