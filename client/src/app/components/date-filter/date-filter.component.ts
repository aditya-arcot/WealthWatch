import { formatDate } from '@angular/common'
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DateFilterEnum } from '../../models/dateFilter'

@Component({
    selector: 'app-date-filter',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './date-filter.component.html',
})
export class DateFilterComponent implements OnChanges {
    dateFilterType = DateFilterEnum

    @Input() selectedFilter: DateFilterEnum = DateFilterEnum.ALL
    @Input() startDate: string | null = null
    @Input() endDate: string | null = null

    private originalSelectedFilter: DateFilterEnum = this.selectedFilter
    private originalStartDate: string | null = this.startDate
    private originalEndDate: string | null = this.endDate

    @Output() filterInputsChanged = new EventEmitter<{
        selectedFilter: DateFilterEnum
        startDate: string | null
        endDate: string | null
    }>()

    ngOnChanges(): void {
        this.originalSelectedFilter = this.selectedFilter
        this.originalStartDate = this.startDate
        this.originalEndDate = this.endDate
    }

    handleFilterChange() {
        if (this.selectedFilter !== DateFilterEnum.CUSTOM) {
            this.computeStartEndDate()
        }
    }

    private computeStartEndDate() {
        switch (this.selectedFilter) {
            case DateFilterEnum.ALL:
                this.startDate = null
                this.endDate = null
                break

            case DateFilterEnum.CURRENT_WEEK: {
                const start = new Date()
                const day = start.getDay() || 7
                if (day !== 1) start.setHours(-24 * (day - 1))

                this.startDate = formatDate(start, 'yyyy-MM-dd', 'en-US')
                this.endDate = null
                break
            }

            case DateFilterEnum.CURRENT_MONTH: {
                const start = new Date()
                start.setDate(1)

                this.setStartDate(start)
                this.setEndDate(null)
                break
            }

            case DateFilterEnum.CURRENT_YEAR: {
                const start = new Date()
                start.setMonth(0)
                start.setDate(1)

                this.setStartDate(start)
                this.setEndDate(null)
                break
            }

            case DateFilterEnum.PAST_WEEK: {
                const start = new Date()
                start.setHours(-24 * 6)

                this.setStartDate(start)
                this.setEndDate(null)
                break
            }

            case DateFilterEnum.PAST_MONTH: {
                const start = new Date()
                start.setHours(-24 * 29)

                this.setStartDate(start)
                this.setEndDate(null)
                break
            }

            case DateFilterEnum.LAST_WEEK: {
                const end = new Date()
                const day = end.getDay() || 7
                if (day !== 1) end.setHours(-24 * day)

                const start = new Date(end.getTime())
                start.setHours(-24 * 6)

                this.setStartDate(start)
                this.setEndDate(end)
                break
            }

            case DateFilterEnum.LAST_MONTH: {
                const end = new Date()
                end.setDate(1)
                end.setHours(-24)

                const start = new Date(end.getTime())
                start.setDate(1)

                this.setStartDate(start)
                this.setEndDate(end)
                break
            }

            case DateFilterEnum.LAST_YEAR: {
                const end = new Date()
                end.setMonth(0)
                end.setDate(1)
                end.setHours(-24)

                const start = new Date(end.getTime())
                start.setMonth(0)
                start.setDate(1)

                this.setStartDate(start)
                this.setEndDate(end)
                break
            }
        }
    }

    private setStartDate(date: Date | null) {
        if (!date) {
            this.startDate = date
            return
        }
        this.startDate = formatDate(date, 'yyyy-MM-dd', 'en-US')
    }

    private setEndDate(date: Date | null) {
        if (!date) {
            this.endDate = date
            return
        }
        this.endDate = formatDate(date, 'yyyy-MM-dd', 'en-US')
    }

    inputsChanged(): boolean {
        if (this.originalSelectedFilter !== this.selectedFilter) {
            return true
        }
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            if (
                this.originalStartDate !== this.startDate ||
                this.originalEndDate !== this.endDate
            ) {
                return true
            }
        }
        return false
    }

    filterApplied(): boolean {
        return this.originalSelectedFilter !== this.dateFilterType.ALL
    }

    clear() {
        this.selectedFilter = DateFilterEnum.ALL
        this.startDate = null
        this.endDate = null
        this.filterInputsChanged.emit({
            selectedFilter: this.selectedFilter,
            startDate: this.startDate,
            endDate: this.endDate,
        })
    }

    apply() {
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            if (!this.startDate && !this.endDate) {
                this.selectedFilter = DateFilterEnum.ALL
            }
        }
        this.filterInputsChanged.emit({
            selectedFilter: this.selectedFilter,
            startDate: this.startDate,
            endDate: this.endDate,
        })
    }

    cancel() {
        this.selectedFilter = this.originalSelectedFilter
        this.startDate = this.originalStartDate
        this.endDate = this.originalEndDate
    }
}
