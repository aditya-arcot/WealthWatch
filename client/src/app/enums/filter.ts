export enum AmountFilterEnum {
    ALL = 'all',
    EXACTLY = 'exactly',
    GREATER_THAN = 'greaterThan',
    LESS_THAN = 'lessThan',
    BETWEEN = 'between',
}

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
