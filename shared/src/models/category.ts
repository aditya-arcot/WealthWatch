import { CategoryEnum, CategoryGroupEnum } from '@enums'

export interface Category {
    id: CategoryEnum
    name: string
    groupId: CategoryGroupEnum
}
