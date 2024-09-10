import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class PercentService {
    private formatter: Intl.NumberFormat = new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
    })

    format(percent: number | null): string {
        if (percent === null) return ''
        return this.formatter.format(percent)
    }
}
