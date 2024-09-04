import { BarElement, ChartType, TooltipPositionerFunction } from 'chart.js'

declare module 'chart.js' {
    interface TooltipPositionerMap {
        center: TooltipPositionerFunction<ChartType>
    }
}

export interface CustomBarElement extends BarElement {
    height: number
    base: number
}
