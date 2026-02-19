/**
 * ── Text Cleaner ──
 * General-purpose text sanitization for scraped data.
 */

/**
 * Clean a product title: collapse whitespace, trim, remove excess special chars.
 * @param {string|null|undefined} raw
 * @returns {string}
 */
const cleanTitle = (raw) => {
    if (!raw || typeof raw !== "string") return "N/A";

    return raw
        .replace(/\s+/g, " ")            // collapse multiple spaces/newlines
        .replace(/[\t\r\n]/g, " ")       // tabs & newlines → space
        .replace(/\s{2,}/g, " ")         // double-space cleanup
        .trim() || "N/A";
};

/**
 * Extract hostname from URL (stripping www.), useful for source field.
 * @param {string} url
 * @returns {string}
 */
const extractSource = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return "unknown";
    }
};

/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
const truncate = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.slice(0, maxLength).trim() + "…";
};

export { cleanTitle, extractSource, truncate };
