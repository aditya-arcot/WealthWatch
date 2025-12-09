/* eslint-disable @typescript-eslint/naming-convention */
import * as z from 'zod'

export const RequestAccessBodySchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
})

export const ValidateAccessCodeBodySchema = z.object({
    accessCode: z.string().length(8),
})

export const RegisterBodySchema = z.object({
    accessCode: z.string().length(8),
    username: z.string(),
    password: z.string().min(8),
})

export const LoginBodySchema = z.object({
    username: z.string(),
    password: z.string().min(8),
})
