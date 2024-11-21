import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class DateService {
    private options: Intl.DateTimeFormatOptions = {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
    }

    format(date: Date | null): string {
        if (date === null) return '-'
        return new Date(date).toLocaleString(undefined, this.options)
    }
}
