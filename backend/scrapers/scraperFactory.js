/**
 * ── Scraper Factory (Adapter Pattern Router) ──
 *
 * Maps hostnames to their corresponding scraper adapter.
 * Usage:
 *   const data = await ScraperFactory.scrape("https://www.amazon.in/dp/...");
 *   // => { title, price, availability }
 */

import AmazonScraper from "./amazon/amazon.scraper.js";
import FlipkartScraper from "./flipkart/flipkart.scraper.js";
import MyntraScraper from "./myntra/myntra.scraper.js";
import AjioScraper from "./ajio/ajio.scraper.js";
import MeeshoScraper from "./meesho/meesho.scraper.js";
import NykaaScraper from "./nykaa/nykaa.scraper.js";
import SnapdealScraper from "./snapdeal/snapdeal.scraper.js";

// ── Registry: hostname keyword → Scraper instance ──
const scraperRegistry = [
    { keywords: ["amazon"], scraper: new AmazonScraper() },
    { keywords: ["flipkart"], scraper: new FlipkartScraper() },
    { keywords: ["myntra"], scraper: new MyntraScraper() },
    { keywords: ["ajio"], scraper: new AjioScraper() },
    { keywords: ["meesho"], scraper: new MeeshoScraper() },
    { keywords: ["nykaa"], scraper: new NykaaScraper() },
    { keywords: ["snapdeal"], scraper: new SnapdealScraper() },
];

class ScraperFactory {
    /**
     * Resolve a URL to the correct scraper and return standardized data.
     * @param {string} url - The product page URL
     * @returns {{ title: string, price: number, availability: boolean }}
     */
    static async scrape(url) {
        const scraper = ScraperFactory.resolve(url);
        return scraper.scrape(url);
    }

    /**
     * Find the matching scraper for a given URL.
     * @param {string} url
     * @returns {BaseScraper}
     */
    static resolve(url) {
        let hostname;
        try {
            hostname = new URL(url).hostname.toLowerCase();
        } catch {
            throw new Error(`Invalid URL: ${url}`);
        }

        const match = scraperRegistry.find((entry) =>
            entry.keywords.some((kw) => hostname.includes(kw))
        );

        if (!match) {
            throw new Error(
                `No scraper available for "${hostname}". Supported: ${ScraperFactory.supportedSites().join(", ")}`
            );
        }

        return match.scraper;
    }

    /**
     * List all supported site keywords.
     */
    static supportedSites() {
        return scraperRegistry.map((entry) => entry.keywords[0]);
    }
}

export default ScraperFactory;
