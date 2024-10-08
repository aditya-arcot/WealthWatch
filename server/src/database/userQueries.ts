import { User } from '../models/user.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertUser = async (user: User): Promise<User | undefined> => {
    const values: unknown[] = [
        user.username,
        user.email,
        user.firstName,
        user.lastName,
        user.passwordHash,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO users (
            username,
            email,
            first_name,
            last_name,
            password_hash
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbUser>(query, values)).rows
    if (!rows[0]) return
    return mapDbUser(rows[0])
}

export const fetchUsers = async (): Promise<User[]> => {
    const query = 'SELECT * FROM users'
    const rows = (await runQuery<DbUser>(query)).rows
    return rows.map(mapDbUser)
}

export const fetchUserWithUsername = async (
    username: string
): Promise<User | undefined> => {
    const query = 'SELECT * FROM users WHERE username = $1'
    const rows = (await runQuery<DbUser>(query, [username])).rows
    if (!rows[0]) return
    return mapDbUser(rows[0])
}

export const fetchUserWithEmail = async (
    email: string
): Promise<User | undefined> => {
    const query = 'SELECT * FROM users WHERE email = $1'
    const rows = (await runQuery<DbUser>(query, [email])).rows
    if (!rows[0]) return
    return mapDbUser(rows[0])
}

export const removeUserWithId = async (userId: number) => {
    await runQuery('DELETE FROM users WHERE id = $1', [userId])
}

interface DbUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    password_hash: string
}

const mapDbUser = (user: DbUser): User => ({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    passwordHash: user.password_hash,
})
