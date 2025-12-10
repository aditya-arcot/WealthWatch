/* eslint-disable @typescript-eslint/naming-convention */
import { LinkSessionSuccessMetadata } from 'plaid'
import * as z from 'zod'
import { NotificationTypeEnum } from '../enums/index.js'

export const CreateLinkTokenBodySchema = z.object({
    itemId: z.int().optional(),
    updateAccounts: z.boolean().optional(),
})

export const PlaidLinkEventSchema = z.object({
    id: z.int(),
    userId: z.int().min(1),
    timestamp: z.iso.datetime(),
    type: z.string(),
    sessionId: z.string(),
    requestId: z.string().nullable().optional(),
    institutionId: z.string().nullable().optional(),
    institutionName: z.string().nullable().optional(),
    publicToken: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    errorType: z.string().nullable().optional(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
})

export const HandleLinkEventBodySchema = z.object({
    event: PlaidLinkEventSchema,
})

export const ExchangePublicTokenBodySchema = z.object({
    publicToken: z.string(),
    metadata: z.custom<LinkSessionSuccessMetadata>((val) => {
        return typeof val === 'object' && val !== null
    }),
})

export const HandleLinkUpdateCompleteBodySchema = z.object({
    itemId: z.int().min(1),
    notificationTypeId: z
        .int()
        .refine((val) => Object.values(NotificationTypeEnum).includes(val)),
})
