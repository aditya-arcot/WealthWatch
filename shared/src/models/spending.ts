import { CategoryEnum } from '../enums/index.js'

export interface CategorySummary {
    categoryId: CategoryEnum
    total: number
    count: number
}

export interface CategoryTotalByDate {
    categoryId: CategoryEnum
    totalByDate: [
        {
            date: Date
            total: number
        },
    ]
}
