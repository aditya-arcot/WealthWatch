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

    formatAmount(amount: number | null, currency: string | null): string {
        if (amount === null) return ''
        if (currency === null) return amount.toString()
        if (!this.formatters[amount]) {
            this.formatters[amount] = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
            })
        }
        return this.formatters[amount].format(amount)
    }
}
