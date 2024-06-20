export interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    salt: string | null
    hash: string | null
}
