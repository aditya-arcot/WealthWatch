export interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    password_salt: string | null
    password_hash: string | null
}
