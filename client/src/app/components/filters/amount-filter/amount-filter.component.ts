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
import { AmountFilterEnum } from '@enums/filter'

@Component({
    selector: 'app-amount-filter',
    imports: [FormsModule],
    templateUrl: './amount-filter.component.html',
})
export class AmountFilterComponent implements OnInit, OnChanges {
    @ViewChild('amountFilterModal', { static: true })
    amountFilterModal!: ElementRef

    @Input({ required: true }) selectedFilter: AmountFilterEnum =
        AmountFilterEnum.All
    @Input({ required: true }) minAmount: number | null = null
    @Input({ required: true }) maxAmount: number | null = null

    @Output() filterInputsChanged = new EventEmitter<{
        selectedFilter: AmountFilterEnum
        minAmount: number | null
        maxAmount: number | null
    }>()

    amountFilterType = AmountFilterEnum

    originalSelectedFilter: AmountFilterEnum = this.selectedFilter
    originalMinAmount: number | null = this.minAmount
    originalMaxAmount: number | null = this.maxAmount

    cancelOnExit = true

    ngOnInit(): void {
        const modalElement = this.amountFilterModal.nativeElement as HTMLElement
        modalElement.addEventListener('hidden.bs.modal', (event: Event) => {
            if (event.target === this.amountFilterModal.nativeElement) {
                if (this.cancelOnExit) {
                    this.cancel()
                }
                this.cancelOnExit = true
            }
        })
    }

    ngOnChanges(): void {
        this.originalSelectedFilter = this.selectedFilter
        this.originalMinAmount = this.minAmount
        this.originalMaxAmount = this.maxAmount
    }

    handleFilterChange() {
        switch (this.selectedFilter) {
            case AmountFilterEnum.All:
                this.minAmount = null
                this.maxAmount = null
                break

            case AmountFilterEnum.Exactly:
                this.maxAmount = null
                break

            case AmountFilterEnum.GreaterThan:
                this.maxAmount = null
                break

            case AmountFilterEnum.LessThan:
                this.minAmount = null
                break
        }
    }

    inputsChanged(): boolean {
        if (this.originalSelectedFilter !== this.selectedFilter) {
            return true
        }
        if (this.selectedFilter === AmountFilterEnum.Exactly) {
            return this.originalMinAmount !== this.minAmount
        }
        if (this.selectedFilter === AmountFilterEnum.GreaterThan) {
            return this.originalMinAmount !== this.minAmount
        }
        if (this.selectedFilter === AmountFilterEnum.LessThan) {
            return this.originalMaxAmount !== this.maxAmount
        }
        if (this.selectedFilter === AmountFilterEnum.Between) {
            return (
                this.originalMinAmount !== this.minAmount ||
                this.originalMaxAmount !== this.maxAmount
            )
        }
        return false
    }

    minAmountValid(): boolean {
        if (
            this.selectedFilter !== AmountFilterEnum.All &&
            this.selectedFilter !== AmountFilterEnum.LessThan
        ) {
            return this.minAmount !== null && this.minAmount >= 0
        }
        return true
    }

    maxAmountValid(): boolean {
        if (this.selectedFilter === AmountFilterEnum.LessThan) {
            return this.maxAmount !== null
        } else if (this.selectedFilter === AmountFilterEnum.Between) {
            if (this.maxAmount === null) {
                return false
            }
            if (this.minAmount !== null) {
                return this.minAmount <= this.maxAmount && this.maxAmount >= 0
            }
        }
        return true
    }

    filterApplied(): boolean {
        return this.originalSelectedFilter !== AmountFilterEnum.All
    }

    clear() {
        this.cancelOnExit = false
        this.selectedFilter = AmountFilterEnum.All
        this.minAmount = null
        this.maxAmount = null
        this.filterInputsChanged.emit({
            selectedFilter: this.selectedFilter,
            minAmount: this.minAmount,
            maxAmount: this.maxAmount,
        })
    }

    apply() {
        this.cancelOnExit = false
        if (this.selectedFilter === AmountFilterEnum.Exactly) {
            if (this.minAmount === null) {
                this.selectedFilter = AmountFilterEnum.All
            }
            this.maxAmount = this.minAmount
        } else if (this.selectedFilter === AmountFilterEnum.GreaterThan) {
            if (this.minAmount === null) {
                this.selectedFilter = AmountFilterEnum.All
            }
        } else if (this.selectedFilter === AmountFilterEnum.LessThan) {
            if (this.maxAmount === null) {
                this.selectedFilter = AmountFilterEnum.All
            }
        } else if (this.selectedFilter === AmountFilterEnum.Between) {
            if (this.minAmount === null || this.maxAmount === null) {
                this.selectedFilter = AmountFilterEnum.All
            }
        }

        this.filterInputsChanged.emit({
            selectedFilter: this.selectedFilter,
            minAmount: this.minAmount,
            maxAmount: this.maxAmount,
        })
    }

    cancel() {
        this.selectedFilter = this.originalSelectedFilter
        this.minAmount = this.originalMinAmount
        this.maxAmount = this.originalMaxAmount
    }
}
