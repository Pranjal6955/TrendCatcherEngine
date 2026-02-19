/**
 * ── BaseScraper (Adapter Interface) ──
 *
 * Every scraper must extend this class and implement the `scrape()` method.
 * The method MUST return a standardized object:
 *   { title: string, price: number, availability: boolean }
 */

import axios from "axios";
import * as cheerio from "cheerio";

class BaseScraper {
    constructor(name) {
        this.name = name;
    }

    /**
     * Fetch raw HTML from a URL with browser-like headers.
     * Shared utility for all scrapers.
     */
    async fetchPage(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                },
                timeout: 15000,
            });
            return cheerio.load(data);
        } catch (error) {
            throw new Error(
                `[${this.name}] Failed to fetch page: ${error.message}`
            );
        }
    }

    /**
     * Must be implemented by every child scraper.
     * @param {string} url - product URL
     * @returns {{ title: string, price: number, availability: boolean }}
     */
    async scrape(url) {
        throw new Error(
            `[${this.name}] scrape() method is not implemented`
        );
    }
}

export default BaseScraper;
