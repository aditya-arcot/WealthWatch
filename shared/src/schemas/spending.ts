/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'

export const GetUserCategorySummariesQuerySchema = z.object({
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
})

export const GetUserSpendingCategoryTotalsQuerySchema = z.object({
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
})
