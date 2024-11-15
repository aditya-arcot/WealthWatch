export interface CategorySummary {
    categoryId: number
    total: number
    count: number
}

export interface CategoryTotalByDate {
    categoryId: number
    totalByDate: [
        {
            date: string
            total: number
        },
    ]
}
