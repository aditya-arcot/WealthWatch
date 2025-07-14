import { CategoryEnum, CategoryGroupEnum } from '../enums/category.js'

export interface Category {
    id: CategoryEnum
    name: string
    groupId: CategoryGroupEnum
}
