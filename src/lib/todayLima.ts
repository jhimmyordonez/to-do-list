/**
 * Returns the current date in Lima, Peru timezone as YYYY-MM-DD string.
 * Uses Intl.DateTimeFormat for accurate timezone conversion.
 */
export function todayInLimaISO(): string {
    const now = new Date();

    // Format date parts in Lima timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // en-CA locale gives us YYYY-MM-DD format directly
    return formatter.format(now);
}

/**
 * Parses a date string and returns it formatted for display.
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}
