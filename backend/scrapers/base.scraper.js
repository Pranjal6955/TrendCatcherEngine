/**
 * ── BaseScraper (Adapter Interface for Puppeteer) ──
 *
 * Every scraper extends this class.
 * Provides a standardized browser factory for scraping.
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Activate stealth globally
puppeteer.use(StealthPlugin());

class BaseScraper {
    constructor(name) {
        this.name = name;
    }

    /**
     * Create a configured Puppeteer browser instance.
     * Uses: Headless, Stealth, No-Sandbox, Resource Blocking.
     */
    async launchBrowser() {
        return await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
                "--window-size=1920,1080",
                "--disable-infobars",
                "--lang=en-US,en"
            ],
        });
    }

    /**
     * Helper: Setup a page with stealth headers and resource blocking.
     * @param {Browser} browser 
     */
    async createPage(browser) {
        const page = await browser.newPage();

        // mimic real user agent
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        // extra headers
        await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
        });

        // block heavy resources
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            const resourceType = req.resourceType();
            if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        return page;
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
