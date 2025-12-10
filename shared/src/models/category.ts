import { CategoryEnum, CategoryGroupEnum } from '../enums/index.js'

export interface Category {
    id: CategoryEnum
    name: string
    groupId: CategoryGroupEnum
}
