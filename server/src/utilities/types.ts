import { User } from 'wealthwatch-shared'

declare module 'express-session' {
    interface SessionData {
        user: User
    }
}
