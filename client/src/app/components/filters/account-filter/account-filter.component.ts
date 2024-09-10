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
import { Account } from '../../../models/account'
import { Item } from '../../../models/item'
import { handleCheckboxSelect } from '../../../utilities/checkbox.utility'

@Component({
    selector: 'app-account-filter',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './account-filter.component.html',
    styleUrl: './account-filter.component.css',
})
export class AccountFilterComponent implements OnInit, OnChanges {
    @ViewChild('accountFilterModal', { static: true })
    accountFilterModal!: ElementRef
    @Input({ required: true }) accounts: Account[] = []
    @Input({ required: true }) items: Item[] = []
    @Input({ required: true }) originalSelectedAccountIds: Set<number> =
        new Set<number>()
    @Output() selectedAccountsChanged = new EventEmitter<{
        selectedAccountIds: Set<number>
    }>()

    selectedAccountIds: Set<number> = new Set<number>(
        this.originalSelectedAccountIds
    )
    cancelOnExit = true

    ngOnInit(): void {
        const modalElement = this.accountFilterModal.nativeElement
        modalElement.addEventListener('hidden.bs.modal', (event: Event) => {
            if (event.target === this.accountFilterModal.nativeElement) {
                if (this.cancelOnExit) {
                    this.cancel()
                }
                this.cancelOnExit = true
            }
        })
    }

    ngOnChanges(): void {
        this.selectedAccountIds = new Set<number>(
            this.originalSelectedAccountIds
        )
    }

    getItemAccounts(itemId: number): Account[] {
        return this.accounts.filter((a) => a.itemId === itemId)
    }

    inputChecked(id: number): boolean {
        return this.selectedAccountIds.has(id)
    }

    handleAccountSelect(event: MouseEvent | KeyboardEvent, accountId: number) {
        if (!handleCheckboxSelect(event)) return
        const checkbox = event.target as HTMLInputElement
        if (checkbox.checked) {
            this.selectedAccountIds.add(accountId)
        } else {
            this.selectedAccountIds.delete(accountId)
        }
    }

    accountIdsChanged(): boolean {
        if (
            this.originalSelectedAccountIds.size !==
                this.selectedAccountIds.size ||
            ![...this.originalSelectedAccountIds].every((value) =>
                this.selectedAccountIds!.has(value)
            )
        ) {
            return true
        }
        return false
    }

    filterApplied(): boolean {
        return this.originalSelectedAccountIds.size !== 0
    }

    invert() {
        const newSelectedAccountIds = new Set<number>()
        this.accounts.forEach((a) => {
            if (!this.selectedAccountIds.has(a.id)) {
                newSelectedAccountIds.add(a.id)
            }
        })
        this.selectedAccountIds = newSelectedAccountIds
    }

    clear() {
        this.cancelOnExit = false
        this.selectedAccountIds = new Set<number>()
        this.selectedAccountsChanged.emit({
            selectedAccountIds: this.selectedAccountIds,
        })
    }

    apply() {
        this.cancelOnExit = false
        this.selectedAccountsChanged.emit({
            selectedAccountIds: this.selectedAccountIds,
        })
    }

    cancel() {
        this.selectedAccountIds = new Set(this.originalSelectedAccountIds)
    }
}
