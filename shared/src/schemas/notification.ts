/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'

export const UpdateUserNotificationToInactiveParamsSchema = z.object({
    notificationId: z.coerce.number().int().min(1),
})
