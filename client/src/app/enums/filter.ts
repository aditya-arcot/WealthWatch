export enum AmountFilterEnum {
    All = 'all',
    Exactly = 'exactly',
    GreaterThan = 'greaterThan',
    LessThan = 'lessThan',
    Between = 'between',
}

export enum DateFilterEnum {
    All,
    CurrentWeek,
    CurrentMonth,
    CurrentYear,
    PastWeek,
    PastMonth,
    LastWeek,
    LastMonth,
    LastYear,
    Custom,
}
