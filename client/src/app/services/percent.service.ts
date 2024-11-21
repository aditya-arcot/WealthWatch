import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class PercentService {
    formatDecimal(decimal: number | null, precision = 1): string {
        if (decimal === null) return ''
        return this.format(decimal, precision)
    }

    formatPercent(percent: number | null, precision = 1): string {
        if (percent === null) return ''
        return this.format(percent / 100, precision)
    }

    private format(num: number, precision: number): string {
        const formatter: Intl.NumberFormat = new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        })
        return formatter.format(num)
    }
}
