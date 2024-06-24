import { runQuery } from '../utils/database.js'

export interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    password_salt: string | null
    password_hash: string | null
}

export const getAllUsers = async (): Promise<User[]> => {
    const query = 'SELECT * FROM users'
    const rows: User[] = (await runQuery(query)).rows
    return rows
}
