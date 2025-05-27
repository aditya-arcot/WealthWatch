import { DateFilterEnum } from '../enums/filter'

export const computeDatesBasedOnFilter = (filter: DateFilterEnum) => {
    let startDate: Date | null = null
    let endDate: Date | null = null

    switch (filter) {
        case DateFilterEnum.All:
            startDate = null
            endDate = null
            break

        case DateFilterEnum.CurrentWeek: {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            const day = start.getDay() || 7
            if (day !== 1) start.setHours(-24 * (day - 1))

            startDate = start ? new Date(start) : null
            endDate = null
            break
        }

        case DateFilterEnum.CurrentMonth: {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            start.setDate(1)

            startDate = start ? new Date(start) : null
            endDate = null
            break
        }

        case DateFilterEnum.CurrentYear: {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            start.setMonth(0)
            start.setDate(1)

            startDate = start ? new Date(start) : null
            endDate = null
            break
        }

        case DateFilterEnum.PastWeek: {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            start.setHours(-24 * 6)

            startDate = start ? new Date(start) : null
            endDate = null
            break
        }

        case DateFilterEnum.PastMonth: {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            start.setHours(-24 * 29)

            startDate = start ? new Date(start) : null
            endDate = null
            break
        }

        case DateFilterEnum.LastWeek: {
            const end = new Date()
            end.setHours(0, 0, 0, 0)
            const day = end.getDay() || 7
            if (day !== 1) end.setHours(-24 * day)

            const start = new Date(end.getTime())
            start.setHours(-24 * 6)

            startDate = start ? new Date(start) : null
            endDate = end ? new Date(end) : null
            break
        }

        case DateFilterEnum.LastMonth: {
            const end = new Date()
            end.setHours(0, 0, 0, 0)
            end.setDate(1)
            end.setHours(-24)

            const start = new Date(end.getTime())
            start.setDate(1)

            startDate = start ? new Date(start) : null
            endDate = end ? new Date(end) : null
            break
        }

        case DateFilterEnum.LastYear: {
            const end = new Date()
            end.setHours(0, 0, 0, 0)
            end.setMonth(0)
            end.setDate(1)
            end.setHours(-24)

            const start = new Date(end.getTime())
            start.setMonth(0)
            start.setDate(1)

            startDate = start ? new Date(start) : null
            endDate = end ? new Date(end) : null
            break
        }
    }

    return { startDate, endDate }
}
