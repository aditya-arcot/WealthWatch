import { runQuery } from '../utils/database.js'
import { logger } from '../utils/logger.js'
import { ExpressError } from './expressError.js'

export interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    password_hash: string
}

export const getAllUsers = async (): Promise<User[]> => {
    logger.debug('getting all users')
    const query = 'SELECT * FROM users'
    const rows: User[] = (await runQuery(query)).rows
    return rows
}

export const getUserByUsername = async (
    username: string
): Promise<User | null> => {
    logger.debug('getting user by username')
    const query = 'SELECT * FROM users WHERE username = $1'
    const rows: User[] = (await runQuery(query, [username])).rows
    if (!rows[0]) return null
    return rows[0]
}

export const createUser = async (user: User): Promise<User> => {
    logger.debug('creating user')
    if (
        !user.username ||
        !user.email ||
        !user.first_name ||
        !user.last_name ||
        !user.password_hash
    ) {
        throw new ExpressError('missing user info', 400)
    }
    const query =
        'INSERT INTO users (username, email, first_name, last_name, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *'
    const res = await runQuery(query, [
        user.username,
        user.email,
        user.first_name,
        user.last_name,
        user.password_hash,
    ])
    return res.rows[0] as User
}
