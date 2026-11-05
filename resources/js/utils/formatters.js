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

/**
 * Fallback SVG Data URIs styled with Royal Navy (#1B365D) and Warm Gold (#C59B27).
 */
export const FALLBACK_ROOM_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bgRoom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B365D"/>
      <stop offset="100%" stop-color="#0F2342"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bgRoom)"/>
  <rect x="30" y="30" width="740" height="440" rx="16" fill="#0F172A" opacity="0.45" stroke="#C59B27" stroke-width="1.5" stroke-opacity="0.3"/>
  <circle cx="400" cy="200" r="54" fill="#C59B27" opacity="0.12"/>
  <path d="M360 215h80M370 195v40M430 195v40" stroke="#C59B27" stroke-width="4" stroke-linecap="round"/>
  <path d="M352 235h96a6 6 0 0 1 6 6v14H346v-14a6 6 0 0 1 6-6z" fill="#C59B27"/>
  <text x="400" y="305" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">RP LUXURY SUITE</text>
  <text x="400" y="332" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="600" fill="#C59B27" text-anchor="middle" letter-spacing="2">RWANDA PREMIUM HOSPITALITY</text>
</svg>
`);

export const FALLBACK_HOTEL_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bgHotel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B365D"/>
      <stop offset="100%" stop-color="#0F2342"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bgHotel)"/>
  <rect x="30" y="30" width="740" height="440" rx="16" fill="#0F172A" opacity="0.45" stroke="#C59B27" stroke-width="1.5" stroke-opacity="0.3"/>
  <circle cx="400" cy="195" r="54" fill="#C59B27" opacity="0.12"/>
  <path d="M370 235V175l30-20 30 20v60M385 195h10M405 195h10M385 215h10M405 215h10" stroke="#C59B27" stroke-width="3" stroke-linecap="round" fill="none"/>
  <text x="400" y="300" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">RP HOTELS &amp; RESORTS</text>
  <text x="400" y="328" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="600" fill="#C59B27" text-anchor="middle" letter-spacing="2">KIGALI • KARONGI • RUBAVU</text>
</svg>
`);

/**
 * Resolve local/remote image URL with fallback.
 * @param {string|null} imagePath
 * @param {'room'|'hotel'} fallbackType
 * @returns {string}
 */
export const getImageUrl = (imagePath, fallbackType = 'room') => {
    const fallback = fallbackType === 'hotel' ? FALLBACK_HOTEL_IMAGE : FALLBACK_ROOM_IMAGE;
    if (!imagePath || typeof imagePath !== 'string') return fallback;
    const trimmed = imagePath.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    if (clean.startsWith('storage/')) {
        return `/${clean}`;
    }
    return `/storage/${clean}`;
};

/**
 * Shared onError event handler for <img> and <CardMedia> components.
 * @param {'room'|'hotel'} fallbackType
 * @returns {(e: React.SyntheticEvent<HTMLImageElement>) => void}
 */
export const handleImageError = (fallbackType = 'room') => {
    const fallback = fallbackType === 'hotel' ? FALLBACK_HOTEL_IMAGE : FALLBACK_ROOM_IMAGE;
    return (e) => {
        if (e && e.currentTarget && e.currentTarget.src !== fallback) {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallback;
        }
    };
};
