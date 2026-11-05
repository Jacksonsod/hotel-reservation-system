/**
 * Shared Hospitality Formatters & Privacy Utilities
 */

/**
 * Format currency in Rwandan Francs with comma separators.
 * Example: 85000 -> "RWF 85,000"
 */
export const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return `RWF ${num.toLocaleString('en-US')}`;
};

/**
 * Format dates consistently into "DD MMM YYYY" or "DD MMM YYYY, HH:mm".
 * Example: "2026-11-05" -> "05 Nov 2026"
 * Example: "2026-11-05T14:30:00" -> "05 Nov 2026, 14:30"
 */
export const formatDate = (dateStr, includeTime = false) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    if (includeTime) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    }

    return `${day} ${month} ${year}`;
};

/**
 * Humanize payment method enum strings into hospitality labels.
 * Example: "mobile_money" -> "Mobile Money"
 * Example: "card" -> "Credit / Debit Card"
 * Example: "cash" -> "Cash at Front Desk"
 */
export const formatPaymentMethod = (method) => {
    if (!method) return '—';
    const normalized = String(method).toLowerCase().trim();
    switch (normalized) {
        case 'mobile_money':
            return 'Mobile Money';
        case 'card':
            return 'Credit / Debit Card';
        case 'cash':
            return 'Cash at Front Desk';
        default:
            return normalized
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
    }
};

/**
 * Humanize snake_case enum status values into Title Case strings.
 * Example: "partially_paid" -> "Partially Paid"
 * Example: "under_maintenance" -> "Under Maintenance"
 */
export const humanizeStatus = (status) => {
    if (!status) return '—';
    const map = {
        available: 'Available',
        reserved: 'Reserved',
        occupied: 'Occupied',
        dirty: 'Dirty',
        clean: 'Clean',
        cleaning: 'Cleaning',
        under_maintenance: 'Under Maintenance',
        inactive: 'Inactive',
        pending: 'Pending',
        confirmed: 'Confirmed',
        checked_in: 'Checked In',
        checked_out: 'Checked Out',
        cancelled: 'Cancelled',
        unpaid: 'Unpaid',
        partially_paid: 'Partially Paid',
        paid: 'Paid',
        completed: 'Completed',
        failed: 'Failed',
        active: 'Active Account',
        suspended: 'Suspended',
        earned: 'Earned Points',
        redeemed: 'Redeemed Points',
        adjusted: 'Points Adjustment',
    };

    const key = String(status).toLowerCase().trim();
    if (map[key]) return map[key];

    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Mask sensitive ID/passport numbers showing only the last 4 characters.
 * Example: "1199880012344821" -> "••••••••4821"
 * Example: "AB4821" -> "••••••••4821"
 */
export const maskIdNumber = (id) => {
    if (!id) return '';
    const str = String(id).trim();
    if (str.length <= 4) {
        return `••••${str}`;
    }
    return `••••••••${str.slice(-4)}`;
};
