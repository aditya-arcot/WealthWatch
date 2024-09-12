export const handleCheckboxSelect = (
    event: MouseEvent | KeyboardEvent
): boolean => {
    if (!(event.target instanceof HTMLInputElement)) {
        return false
    }
    const checkbox = event.target as HTMLInputElement
    // space bar also generates a mouse event
    if (event instanceof KeyboardEvent) {
        if (event.key !== 'Enter') return false
        checkbox.checked = !checkbox.checked
    }
    return true
}
