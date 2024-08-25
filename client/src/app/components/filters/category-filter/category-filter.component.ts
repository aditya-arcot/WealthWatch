import { CommonModule } from '@angular/common'
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
import { Category, CategoryEnum, categoryIcons } from '../../../models/category'

@Component({
    selector: 'app-category-filter',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './category-filter.component.html',
    styleUrl: './category-filter.component.css',
})
export class CategoryFilterComponent implements OnInit, OnChanges {
    @ViewChild('categoryFilterModal', { static: true })
    categoryFilterModal!: ElementRef
    @Input({ required: true }) categories: Category[] = []
    @Input({ required: true }) originalSelectedCategoryIds: Set<number> =
        new Set<number>()
    @Output() selectedCategoriesChanged = new EventEmitter<{
        selectedCategoryIds: Set<number>
    }>()

    selectedCategoryIds: Set<number> = new Set<number>(
        this.originalSelectedCategoryIds
    )
    cancelOnExit = true

    ngOnInit(): void {
        const modalElement = this.categoryFilterModal.nativeElement
        modalElement.addEventListener('hidden.bs.modal', (event: Event) => {
            if (event.target === this.categoryFilterModal.nativeElement) {
                if (this.cancelOnExit) {
                    this.cancel()
                }
                this.cancelOnExit = true
            }
        })
    }

    ngOnChanges(): void {
        this.selectedCategoryIds = new Set(this.originalSelectedCategoryIds)
    }

    inputChecked(id: number): boolean {
        return this.selectedCategoryIds.has(id)
    }

    handleCategorySelect(
        event: MouseEvent | KeyboardEvent,
        categoryId: number
    ) {
        if (!(event.target instanceof HTMLInputElement)) {
            return
        }
        const checkbox = event.target as HTMLInputElement

        if (event instanceof KeyboardEvent) {
            // space bar press also generates a click event
            if (event.key !== 'Enter') return
            checkbox.checked = !checkbox.checked
        }

        if (checkbox.checked) {
            this.selectedCategoryIds.add(categoryId)
        } else {
            this.selectedCategoryIds.delete(categoryId)
        }
    }

    getCategoryClass(c: Category): string {
        const categoryId = c.id as CategoryEnum
        return categoryIcons[categoryId]
    }

    categoryIdsChanged(): boolean {
        if (
            this.originalSelectedCategoryIds.size !==
                this.selectedCategoryIds.size ||
            ![...this.originalSelectedCategoryIds].every((value) =>
                this.selectedCategoryIds!.has(value)
            )
        ) {
            return true
        }
        return false
    }

    filterApplied(): boolean {
        return this.originalSelectedCategoryIds.size !== 0
    }

    invert() {
        const newSelectedCategoryIds = new Set<number>()
        this.categories.forEach((c) => {
            if (!this.selectedCategoryIds.has(c.id)) {
                newSelectedCategoryIds.add(c.id)
            }
        })
        this.selectedCategoryIds = newSelectedCategoryIds
    }

    clear() {
        this.cancelOnExit = false
        this.selectedCategoryIds = new Set<number>()
        this.selectedCategoriesChanged.emit({
            selectedCategoryIds: this.selectedCategoryIds,
        })
    }

    apply() {
        this.cancelOnExit = false
        this.selectedCategoriesChanged.emit({
            selectedCategoryIds: this.selectedCategoryIds,
        })
    }

    cancel() {
        this.selectedCategoryIds = new Set(this.originalSelectedCategoryIds)
    }
}
