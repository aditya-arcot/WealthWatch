import { SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum } from 'plaid'

/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'

export const DevForceRefreshItemTransactionsQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevForceRefreshItemInvestmentsQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevSyncItemQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevSyncItemTransactionsQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevSyncItemInvestmentsQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevSyncItemLiabilitiesQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevSyncItemBalancesQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevResetSandboxItemLoginQuerySchema = z.object({
    plaidItemId: z.string(),
})

export const DevFireSandboxWebhookQuerySchema = z.object({
    plaidItemId: z.string(),
    webhookCode: z.enum(WebhookCodeEnum),
})
