export enum DateFilterEnum {
    ALL,
    CURRENT_WEEK,
    CURRENT_MONTH,
    CURRENT_YEAR,
    PAST_WEEK,
    PAST_MONTH,
    LAST_WEEK,
    LAST_MONTH,
    LAST_YEAR,
    CUSTOM,
}

export const dateFilterDescriptions: Record<DateFilterEnum, string> = {
    [DateFilterEnum.ALL]: 'All Time',
    [DateFilterEnum.CURRENT_WEEK]: 'This Week',
    [DateFilterEnum.CURRENT_MONTH]: 'This Month',
    [DateFilterEnum.CURRENT_YEAR]: 'This Year',
    [DateFilterEnum.PAST_WEEK]: 'Past 7 Days',
    [DateFilterEnum.PAST_MONTH]: 'Past 30 Days',
    [DateFilterEnum.LAST_WEEK]: 'Last Week',
    [DateFilterEnum.LAST_MONTH]: 'Last Month',
    [DateFilterEnum.LAST_YEAR]: 'Last Year',
    [DateFilterEnum.CUSTOM]: 'Custom',
}
