import { runQuery } from '../utils/database.js'
import { HttpError } from './httpError.js'

export interface User {
    id: number
    username: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
}

interface DbUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    password_hash: string
}

const mapDbUserToUser = (dbUser: DbUser): User => ({
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    passwordHash: dbUser.password_hash,
})

export const fetchUsers = async (): Promise<User[]> => {
    const query = 'SELECT * FROM users'
    const rows: DbUser[] = (await runQuery(query)).rows
    return rows.map(mapDbUserToUser)
}

export const fetchUserByUsername = async (
    username: string
): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE username = $1'
    const rows: DbUser[] = (await runQuery(query, [username])).rows
    if (!rows[0]) return null
    return mapDbUserToUser(rows[0])
}

export const fetchUserByEmail = async (email: string): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE email = $1'
    const rows: DbUser[] = (await runQuery(query, [email])).rows
    if (!rows[0]) return null
    return mapDbUserToUser(rows[0])
}

export const createUser = async (user: User): Promise<User | null> => {
    if (
        !user.username ||
        !user.email ||
        !user.firstName ||
        !user.lastName ||
        !user.passwordHash
    ) {
        throw new HttpError('missing user info', 400)
    }
    const query =
        'INSERT INTO users (username, email, first_name, last_name, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *'
    const rows: DbUser[] = (
        await runQuery(query, [
            user.username,
            user.email,
            user.firstName,
            user.lastName,
            user.passwordHash,
        ])
    ).rows
    if (!rows[0]) return null
    return mapDbUserToUser(rows[0])
}
