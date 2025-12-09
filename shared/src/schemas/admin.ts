/* eslint-disable @typescript-eslint/naming-convention */
import { AccessRequestStatusEnum } from '@enums'
import * as z from 'zod'

export const ReviewAccessRequestParamsSchema = z.object({
    accessRequestId: z.coerce.number().int().min(1),
})

export const ReviewAccessRequestBodySchema = z.object({
    statusId: z
        .int()
        .refine((val) => Object.values(AccessRequestStatusEnum).includes(val)),
})
