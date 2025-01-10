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
import { dateFilterDescriptions, DateFilterEnum } from '../../../models/filter'
import { checkDatesEqual } from '../../../utilities/date.utility'
import { computeDatesBasedOnFilter } from '../../../utilities/filter.utility'

// all dates are in client timezone

@Component({
    selector: 'app-date-filter',
    imports: [FormsModule],
    templateUrl: './date-filter.component.html',
})
export class DateFilterComponent implements OnInit, OnChanges {
    @ViewChild('dateFilterModal', { static: true }) dateFilterModal!: ElementRef

    @Input({ required: true }) selectedFilter: DateFilterEnum =
        DateFilterEnum.ALL
    @Input({ required: true }) startDate: Date | null = null
    @Input({ required: true }) endDate: Date | null = null
    @Input({ required: false }) showReset? = false

    @Output() filterInputsChanged = new EventEmitter<{
        selectedFilter: DateFilterEnum
        startDate: Date | null
        endDate: Date | null
    }>()
    @Output() resetRange = new EventEmitter<void>()

    dateFilterType = DateFilterEnum
    dateFilters = Object.entries(dateFilterDescriptions).map(
        ([key, value]) => ({
            key: Number(key),
            description: value,
        })
    )

    selectorStartDate: string | null = null
    selectorEndDate: string | null = null

    originalSelectedFilter: DateFilterEnum = this.selectedFilter
    originalStartDate: Date | null = this.startDate
    originalEndDate: Date | null = this.endDate

    cancelOnExit = true

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
        this.computeStartEndDate()
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

    handleFilterChange(filter: string) {
        this.selectedFilter = Number(filter) as DateFilterEnum
        this.computeStartEndDate()
    }

    private computeStartEndDate() {
        if (this.selectedFilter === DateFilterEnum.CUSTOM) {
            this.selectorStartDate =
                this.startDate?.toISOString().split('T')[0] ?? null
            this.selectorEndDate =
                this.endDate?.toISOString().split('T')[0] ?? null
        } else {
            const { startDate, endDate } = computeDatesBasedOnFilter(
                this.selectedFilter
            )
            this.startDate = startDate
            this.endDate = endDate
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

    reset() {
        this.resetRange.emit()
    }
}
