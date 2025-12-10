/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'

export const RefreshItemParamsSchema = z.object({
    plaidItemId: z.string(),
})

export const DeactivateItemParamsSchema = z.object({
    plaidItemId: z.string(),
})
