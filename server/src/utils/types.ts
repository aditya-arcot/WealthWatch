import { User } from '../models/user.js'

declare module 'express-session' {
    interface SessionData {
        user: User
    }
}
