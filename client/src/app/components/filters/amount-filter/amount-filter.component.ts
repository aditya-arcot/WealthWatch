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
import { AmountFilterEnum } from '../../../models/amountFilter'
import { AlertService } from '../../../services/alert.service'

@Component({
    selector: 'app-amount-filter',
    imports: [FormsModule],
    templateUrl: './amount-filter.component.html',
})
export class AmountFilterComponent implements OnInit, OnChanges {
    @ViewChild('amountFilterModal', { static: true })
    amountFilterModal!: ElementRef

    @Input({ required: true }) selectedFilter: AmountFilterEnum =
        AmountFilterEnum.ALL
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

    constructor(private alertSvc: AlertService) {}

    ngOnInit(): void {
        const modalElement = this.amountFilterModal.nativeElement
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
            case AmountFilterEnum.ALL:
                this.minAmount = null
                this.maxAmount = null
                break

            case AmountFilterEnum.EXACTLY:
                this.maxAmount = null
                break

            case AmountFilterEnum.GREATER_THAN:
                this.maxAmount = null
                break

            case AmountFilterEnum.LESS_THAN:
                this.minAmount = null
                break
        }
    }

    inputsChanged(): boolean {
        if (this.originalSelectedFilter !== this.selectedFilter) {
            return true
        }
        if (this.selectedFilter === AmountFilterEnum.EXACTLY) {
            return this.originalMinAmount !== this.minAmount
        }
        if (this.selectedFilter === AmountFilterEnum.GREATER_THAN) {
            return this.originalMinAmount !== this.minAmount
        }
        if (this.selectedFilter === AmountFilterEnum.LESS_THAN) {
            return this.originalMaxAmount !== this.maxAmount
        }
        if (this.selectedFilter === AmountFilterEnum.BETWEEN) {
            return (
                this.originalMinAmount !== this.minAmount ||
                this.originalMaxAmount !== this.maxAmount
            )
        }
        return false
    }

    minAmountValid(): boolean {
        if (
            this.selectedFilter !== AmountFilterEnum.ALL &&
            this.selectedFilter !== AmountFilterEnum.LESS_THAN
        ) {
            return this.minAmount !== null && this.minAmount >= 0
        }
        return true
    }

    maxAmountValid(): boolean {
        if (this.selectedFilter === AmountFilterEnum.LESS_THAN) {
            return this.maxAmount !== null
        } else if (this.selectedFilter === AmountFilterEnum.BETWEEN) {
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
        return this.originalSelectedFilter !== AmountFilterEnum.ALL
    }

    clear() {
        this.cancelOnExit = false
        this.selectedFilter = AmountFilterEnum.ALL
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
        if (this.selectedFilter === AmountFilterEnum.EXACTLY) {
            if (this.minAmount === null) {
                this.selectedFilter = AmountFilterEnum.ALL
            }
            this.maxAmount = this.minAmount
        } else if (this.selectedFilter === AmountFilterEnum.GREATER_THAN) {
            if (this.minAmount === null) {
                this.selectedFilter = AmountFilterEnum.ALL
            }
        } else if (this.selectedFilter === AmountFilterEnum.LESS_THAN) {
            if (this.maxAmount === null) {
                this.selectedFilter = AmountFilterEnum.ALL
            }
        } else if (this.selectedFilter === AmountFilterEnum.BETWEEN) {
            if (this.minAmount === null || this.maxAmount === null) {
                this.selectedFilter = AmountFilterEnum.ALL
            }
        }

        if (!this.minAmountValid() || !this.maxAmountValid()) {
            this.alertSvc.addErrorAlert('Invalid amount(s)', [
                'Update inputs and try again',
            ])
            this.cancel()
            return
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
