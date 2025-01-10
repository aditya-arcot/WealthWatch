import { User } from 'wealthwatch-shared/models/user.js'

declare module 'express-session' {
    interface SessionData {
        user: User
    }
}
