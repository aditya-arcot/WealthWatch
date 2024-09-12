import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    private formatters: Record<string, Intl.NumberFormat> = {
        USD: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }),
    }

    format(amount: number | null, currency: string | null): string {
        if (amount === null) return ''
        if (currency === null) return amount.toString()
        if (!this.formatters[currency]) {
            this.formatters[currency] = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
            })
        }
        return this.formatters[currency].format(amount)
    }
}
