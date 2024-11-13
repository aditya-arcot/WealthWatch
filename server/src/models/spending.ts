export interface CategoryAggregate {
    categoryId: number
    total: number
    count: number
}

export interface CategoryTotalByDate {
    categoryId: number
    totalByDate: number[]
}
