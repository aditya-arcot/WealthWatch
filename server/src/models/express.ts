declare module 'express-session' {
    interface SessionData {
        user: {
            id: number
            username: string
            admin: boolean
        }
        _dummy: boolean
    }
}
