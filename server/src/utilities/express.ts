import { HttpError } from '@models'
import { logger } from '@utilities'
import * as z from 'zod'

export function validate<S extends z.ZodTypeAny>(obj: object, schema: S) {
    const result = schema.safeParse(obj)
    if (!result.success) {
        logger.error(result.error, 'validation failed')
        throw new HttpError('invalid request', 400)
    }
    return result.data
}
