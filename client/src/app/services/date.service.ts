import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class DateService {
    format(date: Date | null, includeTime = true): string {
        if (date === null) return '-'
        const options: Intl.DateTimeFormatOptions = {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
        }
        if (includeTime) {
            options.hour = 'numeric'
            options.minute = 'numeric'
        }
        return new Date(date).toLocaleString(undefined, options)
    }
}
