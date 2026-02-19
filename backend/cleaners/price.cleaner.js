/**
 * ── Price Cleaner ──
 * Normalizes any raw price string into a clean numeric value.
 *
 * Handles:
 *   "₹ 1,999"          → 1999
 *   "INR 1999.00"       → 1999
 *   "Rs. 12,34,999.50"  → 1234999.5
 *   "$29.99"            → 29.99
 *   "MRP: ₹1,299"       → 1299
 *   "  ₹   3,499.00  "  → 3499
 *   "Price: 999/-"      → 999
 *   ""                  → 0
 *   null / undefined    → 0
 */

const CURRENCY_SYMBOLS = [
    "₹", "Rs", "Rs.", "INR", "USD", "$", "€", "£", "¥",
    "MRP", "Price", "Our Price", "Deal Price",
];

/**
 * Strip currency symbols, labels, and whitespace from a price string.
 */
const stripCurrencyLabels = (raw) => {
    let cleaned = raw;

    // Remove known currency words / symbols (case-insensitive)
    for (const sym of CURRENCY_SYMBOLS) {
        cleaned = cleaned.replace(new RegExp(sym.replace(".", "\\."), "gi"), "");
    }

    // Remove trailing "/-" (common in Indian pricing: "999/-")
    cleaned = cleaned.replace(/\/-$/, "");

    // Remove colons, extra spaces
    cleaned = cleaned.replace(/:/g, "").trim();

    return cleaned;
};

/**
 * Detect if the price uses Indian-style grouping (e.g. "12,34,999")
 * vs. Western-style (e.g. "123,999") and normalize accordingly.
 */
const normalizeGrouping = (str) => {
    // Indian-style: groups of 2 after the first group of 3 → "12,34,999"
    // Western-style: groups of 3 → "123,999"
    // Either way, commas are just grouping separators → remove them
    return str.replace(/,/g, "");
};

/**
 * Main: clean any price string to a number.
 * @param {string|number|null|undefined} raw
 * @returns {number} — numeric price, or 0 if unparseable
 */
const cleanPrice = (raw) => {
    // Guard: already a number
    if (typeof raw === "number") return isNaN(raw) ? 0 : raw;

    // Guard: falsy values
    if (!raw || typeof raw !== "string") return 0;

    let cleaned = raw.trim();
    if (cleaned === "") return 0;

    // Step 1: strip labels and symbols
    cleaned = stripCurrencyLabels(cleaned);

    // Step 2: normalize comma grouping
    cleaned = normalizeGrouping(cleaned);

    // Step 3: extract the first numeric value (handles "1999.00" or "1999")
    const match = cleaned.match(/(\d+\.?\d*)/);
    if (!match) return 0;

    const price = parseFloat(match[1]);
    return isNaN(price) ? 0 : price;
};

/**
 * Extract currency code from raw price string.
 * @param {string} raw
 * @returns {string} — e.g. "INR", "USD", "EUR"
 */
const detectCurrency = (raw) => {
    if (!raw || typeof raw !== "string") return "INR";

    const str = raw.trim().toUpperCase();

    if (str.includes("$") || str.includes("USD")) return "USD";
    if (str.includes("€") || str.includes("EUR")) return "EUR";
    if (str.includes("£") || str.includes("GBP")) return "GBP";
    if (str.includes("¥") || str.includes("JPY")) return "JPY";

    // Default for ₹, Rs, INR, or no symbol
    return "INR";
};

export { cleanPrice, detectCurrency };
