import { DateFilterEnum } from '../enums/filter'

export const dateFilterDescriptionMap: Record<DateFilterEnum, string> = {
    [DateFilterEnum.All]: 'All Time',
    [DateFilterEnum.CurrentWeek]: 'This Week',
    [DateFilterEnum.CurrentMonth]: 'This Month',
    [DateFilterEnum.CurrentYear]: 'This Year',
    [DateFilterEnum.PastWeek]: 'Past 7 Days',
    [DateFilterEnum.PastMonth]: 'Past 30 Days',
    [DateFilterEnum.LastWeek]: 'Last Week',
    [DateFilterEnum.LastMonth]: 'Last Month',
    [DateFilterEnum.LastYear]: 'Last Year',
    [DateFilterEnum.Custom]: 'Custom',
}
