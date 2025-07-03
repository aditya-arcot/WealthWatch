import { User } from '../wealthwatch-shared.js'

declare module 'express-session' {
    interface SessionData {
        user: User
    }
}
