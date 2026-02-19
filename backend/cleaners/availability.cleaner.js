/**
 * ── Availability Cleaner ──
 * Normalizes any raw stock / availability text into a clean boolean.
 *
 * Handles:
 *   "In Stock"                  → true
 *   "In stock."                 → true
 *   "Only 3 left in stock"     → true
 *   "Available"                 → true
 *   "Add to Cart"              → true
 *   "Buy Now"                  → true
 *   "Out of Stock"             → false
 *   "Currently Unavailable"    → false
 *   "Sold Out"                 → false
 *   "Not Available"            → false
 *   "Temporarily Unavailable"  → false
 *   "Coming Soon"              → false
 *   "Notify Me"                → false
 *   ""                         → false
 *   null / undefined           → false
 *   true / false               → true / false (passthrough)
 */

// Phrases that clearly mean "NOT available"
const OUT_OF_STOCK_PHRASES = [
    "out of stock",
    "sold out",
    "currently unavailable",
    "temporarily unavailable",
    "not available",
    "unavailable",
    "coming soon",
    "notify me",
    "notify when available",
    "no longer available",
    "discontinued",
    "pre-order",
    "preorder",
    "out of print",
    "check availability",
];

// Phrases that clearly mean "available"
const IN_STOCK_PHRASES = [
    "in stock",
    "available",
    "add to cart",
    "add to bag",
    "buy now",
    "left in stock",
    "in stock.",
    "ships from",
    "delivered by",
    "dispatch",
    "ready to ship",
];

/**
 * Main: clean any availability text into a boolean.
 * @param {string|boolean|null|undefined} raw
 * @returns {boolean}
 */
const cleanAvailability = (raw) => {
    // Passthrough booleans
    if (typeof raw === "boolean") return raw;

    // Falsy → not available
    if (!raw || typeof raw !== "string") return false;

    const text = raw.trim().toLowerCase();
    if (text === "") return false;

    // Check "out of stock" phrases first (higher priority)
    for (const phrase of OUT_OF_STOCK_PHRASES) {
        if (text.includes(phrase)) return false;
    }

    // Check "in stock" phrases
    for (const phrase of IN_STOCK_PHRASES) {
        if (text.includes(phrase)) return true;
    }

    // If we can't determine, assume available (scraper got *some* text)
    return true;
};

/**
 * Extract a structured stock status from raw text.
 * @param {string|boolean|null|undefined} raw
 * @returns {{ available: boolean, label: string }}
 */
const cleanAvailabilityDetailed = (raw) => {
    const available = cleanAvailability(raw);

    let label = "Unknown";
    if (typeof raw === "string" && raw.trim()) {
        label = raw.trim();
    }
    if (typeof raw === "boolean") {
        label = raw ? "In Stock" : "Out of Stock";
    }

    return {
        available,
        label: available ? "In Stock" : "Out of Stock",
        originalText: label,
    };
};

export { cleanAvailability, cleanAvailabilityDetailed };
