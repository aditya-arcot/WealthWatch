import { PlaidLinkEventSchema } from '@schemas'
import * as z from 'zod'

export type PlaidLinkEvent = z.infer<typeof PlaidLinkEventSchema>
