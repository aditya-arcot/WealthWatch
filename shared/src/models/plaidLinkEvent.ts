import * as z from 'zod'
import { PlaidLinkEventSchema } from '../schemas/index.js'

export type PlaidLinkEvent = z.infer<typeof PlaidLinkEventSchema>
