import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DateFilterEnum } from '../../../models/dateFilter'
import { AlertService } from '../../../services/alert.service'
import { checkDatesEqual } from '../../../utilities/date.utility'

// all dates are in client timezone

@Component({
    selector: 'app-date-filter',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './date-filter.component.html',
})
export class DateFilterComponent implements OnInit, OnChanges {
    @ViewChild('dateFilterModal', { static: true }) dateFilterModal!: ElementRef

    @Input({ required: true }) selectedFilter: DateFilterEnum =
        DateFilterEnum.ALL
    @Input({ required: true }) startDate: Date | null = null
    @Input({ required: true }) endDate: Date | null = null

    @Output() filterInputsChanged = new EventEmitter<{
        selectedFilter: DateFilterEnum
        startDate: Date | null
        endDate: Date | null
    }>()

    dateFilterType = DateFilterEnum

    selectorStartDate: string | null = null
    selectorEndDate: string | null = null

    originalSelectedFilter: DateFilterEnum = this.selectedFilter
    originalStartDate: Date | null = this.startDate
    originalEndDate: Date | null = this.endDate

    cancelOnExit = true

    constructor(private alertSvc: AlertService) {}

    ngOnInit(): void {
        const modalElement = this.dateFilterModal.nativeElement
        modalElement.addEventListener('hidden.bs.modal', (event: Event) => {
            if (event.target === this.dateFilterModal.nativeElement) {
                if (this.cancelOnExit) {
                    this.cancel()
                }
                this.cancelOnExit = true
            }
        })
    }

    ngOnChanges(): void {
        this.originalSelectedFilter = this.selectedFilter
        this.originalStartDate = this.startDate
            ? new Date(this.startDate)
            : null
        this.originalEndDate = this.endDate ? new Date(this.endDate) : null
    }

    setSelectorStartDate(value: string) {
        if (value === '') {
            this.startDate = null
            return
        }
        this.startDate = new Date(value + 'T00:00:00')
    }

    setSelectorEndDate(value: string) {
        if (value === '') {
            this.endDate = null
            return
        }
        this.endDate = new Date(value + 'T00:00:00')
    }

    handleFilterChange() {
        this.computeStartEndDate()
    }

    private computeStartEndDate() {
        switch (this.selectedFilter) {
            case DateFilterEnum.ALL:
                this.startDate = null
                this.endDate = null
                break

            case DateFilterEnum.CURRENT_WEEK: {
                const start = new Date()
                start.setHours(0, 0, 0, 0)
                const day = start.getDay() || 7
                if (day !== 1) start.setHours(-24 * (day - 1))

                this.startDate = start ? new Date(start) : null
                this.endDate = null
                break
            }

            case DateFilterEnum.CURRENT_MONTH: {
                const start = new Date()
                start.setHours(0, 0, 0, 0)
                start.setDate(1)

                this.startDate = start ? new Date(start) : null
                this.endDate = null
                break
            }

            case DateFilterEnum.CURRENT_YEAR: {
                const start = new Date()
                start.setHours(0, 0, 0, 0)
                start.setMonth(0)
                start.setDate(1)

                this.startDate = start ? new Date(start) : null
                this.endDate = null
                break
            }

            case DateFilterEnum.PAST_WEEK: {
                const start = new Date()
                start.setHours(0, 0, 0, 0)
                start.setHours(-24 * 6)

                this.startDate = start ? new Date(start) : null
                this.endDate = null
                break
            }

            case DateFilterEnum.PAST_MONTH: {
                const start = new Date()
                start.setHours(0, 0, 0, 0)
                start.setHours(-24 * 29)

                this.startDate = start ? new Date(start) : null
                this.endDate = null
                break
            }

            case DateFilterEnum.LAST_WEEK: {
                const end = new Date()
                end.setHours(0, 0, 0, 0)
                const day = end.getDay() || 7
                if (day !== 1) end.setHours(-24 * day)

                const start = new Date(end.getTime())
                start.setHours(-24 * 6)

                this.startDate = start ? new Date(start) : null
                this.endDate = end ? new Date(end) : null
                break
            }

            case DateFilterEnum.LAST_MONTH: {
                const end = new Date()
                end.setHours(0, 0, 0, 0)
                end.setDate(1)
                end.setHours(-24)

                const start = new Date(end.getTime())
                start.setDate(1)

                this.startDate = start ? new Date(start) : null
                this.endDate = end ? new Date(end) : null
                break
            }

            case DateFilterEnum.LAST_YEAR: {
                const end = new Date()
                end.setHours(0, 0, 0, 0)
                end.setMonth(0)
                end.setDate(1)
                end.setHours(-24)

                const start = new Date(end.getTime())
                start.setMonth(0)
                start.setDate(1)

                this.startDate = start ? new Date(start) : null
                this.endDate = end ? new Date(end) : null
                break
            }

            case DateFilterEnum.CUSTOM: {
                this.selectorStartDate =
                    this.startDate?.toISOString().split('T')[0] ?? null
                this.selectorEndDate =
                    this.endDate?.toISOString().split('T')[0] ?? null
                break
            }
        }
    }

    inputsChanged(): boolean {
        if (this.originalSelectedFilter !== this.selectedFilter) {
            return true
        }
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            return (
                !checkDatesEqual(this.originalStartDate, this.startDate) ||
                !checkDatesEqual(this.originalEndDate, this.endDate)
            )
        }
        return false
    }

    startDateValid(): boolean {
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            return !!this.startDate || !!this.endDate
        }
        return true
    }

    endDateValid(): boolean {
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            if (!this.endDate) {
                return !!this.startDate
            }
            if (this.startDate) {
                return this.startDate <= this.endDate
            }
        }
        return true
    }

    filterApplied(): boolean {
        return this.originalSelectedFilter !== DateFilterEnum.ALL
    }

    clear() {
        this.cancelOnExit = false
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
        this.cancelOnExit = false
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            if (!this.startDate && !this.endDate) {
                this.selectedFilter = DateFilterEnum.ALL
            }
        }

        if (!this.startDateValid() || !this.endDateValid()) {
            this.alertSvc.addErrorAlert('Invalid date range', [
                'Update inputs and try again',
            ])
            this.cancel()
            return
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
            ? new Date(this.originalStartDate)
            : null
        this.endDate = this.originalEndDate
            ? new Date(this.originalEndDate)
            : null
    }
}
