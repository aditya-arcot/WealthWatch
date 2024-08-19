import { Component, EventEmitter, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'

@Component({
    selector: 'app-note',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './note.component.html',
})
export class NoteComponent {
    note: string | null = null
    originalNote: string | null = this.note
    @Output() noteUpdated = new EventEmitter<string | null>()

    noteExists(): boolean {
        return this.originalNote !== null && this.originalNote.length > 0
    }

    noteChanged(): boolean {
        if (this.originalNote === null) {
            return this.note !== null && this.note.length > 0
        }
        return this.note?.trim() !== this.originalNote
    }

    apply() {
        this.noteUpdated.emit(this.note)
    }

    clear() {
        this.note = null
        this.noteUpdated.emit(null)
    }
}
