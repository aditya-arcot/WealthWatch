/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'
import { CategoryEnum } from '../enums/index.js'

export const GetUserTransactionsAndCountsQuerySchema = z.object({
    searchQuery: z.string().optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
    minAmount: z.coerce.number().int().min(0).optional(),
    maxAmount: z.coerce.number().int().min(0).optional(),
    categoryId: z
        .preprocess(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (value) => (Array.isArray(value) ? value : [value]),
            z.array(
                z.coerce
                    .number()
                    .int()
                    .refine((val) => Object.values(CategoryEnum).includes(val))
            )
        )
        .optional(),
    accountId: z
        .preprocess(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (value) => (Array.isArray(value) ? value : [value]),
            z.array(z.coerce.number().int().min(1))
        )
        .optional(),
    limit: z.coerce.number().int().min(0).optional(),
    offset: z.coerce.number().int().min(0).optional(),
})

export const UpdateTransactionCustomNameParamsSchema = z.object({
    plaidTransactionId: z.string(),
})

export const UpdateTransactionCustomNameBodySchema = z.object({
    customName: z.string().nullable(),
})

export const UpdateTransactionCustomCategoryIdParamsSchema = z.object({
    plaidTransactionId: z.string(),
})

export const UpdateTransactionCustomCategoryIdBodySchema = z.object({
    customCategoryId: z
        .int()
        .nullable()
        .refine(
            (val) => val === null || Object.values(CategoryEnum).includes(val)
        ),
})

export const UpdateTransactionNoteParamsSchema = z.object({
    plaidTransactionId: z.string(),
})

export const UpdateTransactionNoteBodySchema = z.object({
    note: z.string().nullable(),
})
