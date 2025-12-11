import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    private formatters: Partial<Record<string, Intl.NumberFormat>> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        USD: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }),
    }

    format(amount: number | null, currency: string | null): string {
        if (amount === null) return '-'
        if (currency === null) return amount.toString()
        this.formatters[currency] ??= new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        })
        return this.formatters[currency].format(amount)
    }
}
