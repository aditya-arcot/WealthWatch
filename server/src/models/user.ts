import { runQuery } from '../utils/database.js'

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

const mapDbUser = (dbUser: DbUser): User => ({
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    passwordHash: dbUser.password_hash,
})

export const retrieveUsers = async (): Promise<User[]> => {
    const query = 'SELECT * FROM users'
    const rows: DbUser[] = (await runQuery(query)).rows
    return rows.map(mapDbUser)
}

export const retrieveUserByUsername = async (
    username: string
): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE username = $1'
    const rows: DbUser[] = (await runQuery(query, [username])).rows
    if (!rows[0]) return null
    return mapDbUser(rows[0])
}

export const retrieveUserByEmail = async (
    email: string
): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE email = $1'
    const rows: DbUser[] = (await runQuery(query, [email])).rows
    if (!rows[0]) return null
    return mapDbUser(rows[0])
}

export const createUser = async (
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    passwordHash: string
): Promise<User | null> => {
    const query = `
        INSERT INTO users (
            username, 
            email, 
            first_name, 
            last_name, 
            password_hash
        ) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`
    const rows: DbUser[] = (
        await runQuery(query, [
            username,
            email,
            firstName,
            lastName,
            passwordHash,
        ])
    ).rows
    if (!rows[0]) return null
    return mapDbUser(rows[0])
}

export const deleteUser = async (userId: number) => {
    await runQuery('DELETE FROM users WHERE id = $1', [userId])
}
