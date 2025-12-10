/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'
import { AccessRequestStatusEnum } from '../enums/index.js'

export const ReviewAccessRequestParamsSchema = z.object({
    accessRequestId: z.coerce.number().int().min(1),
})

export const ReviewAccessRequestBodySchema = z.object({
    statusId: z
        .int()
        .refine((val) => Object.values(AccessRequestStatusEnum).includes(val)),
})
