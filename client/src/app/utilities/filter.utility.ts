import { DateFilterEnum } from '@enums/filter'

export const computeDatesFromFilter = (filter: DateFilterEnum) => {
    switch (filter) {
        case DateFilterEnum.All:
            return {
                startDate: null,
                endDate: null,
            }

        case DateFilterEnum.CurrentWeek: {
            const startDate = new Date()
            startDate.setHours(0, 0, 0, 0)
            const day = startDate.getDay() || 7
            if (day !== 1) startDate.setHours(-24 * (day - 1))

            return {
                startDate,
                endDate: null,
            }
        }

        case DateFilterEnum.CurrentMonth: {
            const startDate = new Date()
            startDate.setHours(0, 0, 0, 0)
            startDate.setDate(1)

            return {
                startDate,
                endDate: null,
            }
        }

        case DateFilterEnum.CurrentYear: {
            const startDate = new Date()
            startDate.setHours(0, 0, 0, 0)
            startDate.setMonth(0)
            startDate.setDate(1)

            return {
                startDate,
                endDate: null,
            }
        }

        case DateFilterEnum.PastWeek: {
            const startDate = new Date()
            startDate.setHours(0, 0, 0, 0)
            startDate.setHours(-24 * 6)

            return {
                startDate,
                endDate: null,
            }
        }

        case DateFilterEnum.PastMonth: {
            const startDate = new Date()
            startDate.setHours(0, 0, 0, 0)
            startDate.setHours(-24 * 29)

            return {
                startDate,
                endDate: null,
            }
        }

        case DateFilterEnum.LastWeek: {
            const endDate = new Date()
            endDate.setHours(0, 0, 0, 0)
            const day = endDate.getDay() || 7
            if (day !== 1) endDate.setHours(-24 * day)

            const startDate = new Date(endDate.getTime())
            startDate.setHours(-24 * 6)

            return {
                startDate,
                endDate,
            }
        }

        case DateFilterEnum.LastMonth: {
            const endDate = new Date()
            endDate.setHours(0, 0, 0, 0)
            endDate.setDate(1)
            endDate.setHours(-24)

            const startDate = new Date(endDate.getTime())
            startDate.setDate(1)

            return {
                startDate,
                endDate,
            }
        }

        case DateFilterEnum.LastYear: {
            const endDate = new Date()
            endDate.setHours(0, 0, 0, 0)
            endDate.setMonth(0)
            endDate.setDate(1)
            endDate.setHours(-24)

            const startDate = new Date(endDate.getTime())
            startDate.setMonth(0)
            startDate.setDate(1)

            return {
                startDate,
                endDate,
            }
        }

        default:
            throw Error('unexpected filter value')
    }
}
