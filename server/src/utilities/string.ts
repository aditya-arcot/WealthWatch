import { prod, vars } from '@utilities'

export const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toTitleCase = (str: string): string =>
    str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

export const createCookieName = (type: string) =>
    prod ? `wealthwatch-${type}` : `wealthwatch-${vars.nodeEnv}-${type}`
