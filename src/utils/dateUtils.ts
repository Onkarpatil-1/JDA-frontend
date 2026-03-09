/**
 * Robustly parse date strings supporting DD-MM-YYYY (new) and MM/DD/YYYY (fallback).
 */
export function parseDateString(dateStr: string | null | undefined): Date | null {
    if (!dateStr || dateStr === 'NULL' || typeof dateStr !== 'string') return null;

    try {
        // Priority 1: DD-MM-YYYY (User request)
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const [d, m, y] = parts.map(Number);
                if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                    // Validate month (1-12) and day (1-31)
                    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                        return new Date(y, m - 1, d);
                    }
                }
            }
        }

        // Priority 2: MM/DD/YYYY (Legacy format)
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const [m, d, y] = parts.map(Number);
                if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                        return new Date(y, m - 1, d);
                    }
                }
            }
        }

        // Priority 3: Native JS parsing (YYYY-MM-DD or standard)
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

/**
 * Calculate difference in days between two dates.
 */
export function calculateDaysDifference(startDateStr: string, endDateStr: string): number | null {
    const start = parseDateString(startDateStr);
    const end = parseDateString(endDateStr);

    if (start && end) {
        return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return null;
}
