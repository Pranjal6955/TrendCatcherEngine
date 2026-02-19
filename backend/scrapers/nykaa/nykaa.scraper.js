
import BaseScraper from "../base.scraper.js";

class NykaaScraper extends BaseScraper {
    constructor() {
        super("Nykaa");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            try {
                // Wait for product header
                await page.waitForSelector("h1", { timeout: 10000 });
            } catch (e) {
                // Ignore
            }

            const data = await page.evaluate(() => {
                const getTitle = () => {
                    return document.querySelector("h1")?.innerText.trim() || document.title;
                };

                const getPrice = () => {
                    // Try semantic or data-attribute
                    // Nykaa often has .css-1jczs19 containing price
                    // Also meta[property="product:price:amount"]
                    const metaPrice = document.querySelector('meta[property="product:price:amount"]');
                    if (metaPrice) return parseFloat(metaPrice.content);

                    const span = document.querySelector("span.css-1jczs19") || document.querySelector(".css-1e492kkw");
                    if (span) {
                        return parseFloat(span.innerText.replace(/[^0-9.]/g, ""));
                    }
                    return 0;
                };

                const getAvailability = () => {
                    const btn = document.querySelector("button");
                    if (btn && btn.innerText.toLowerCase().includes("sold out")) return false;
                    const metaAvail = document.querySelector('meta[property="product:availability"]');
                    if (metaAvail && metaAvail.content !== "instock") return false;
                    return true;
                };

                return {
                    title: getTitle(),
                    price: getPrice(),
                    availability: getAvailability(),
                };
            });

            return data;
        } catch (error) {
            throw new Error(`[${this.name}] Failed to scrape: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
    }
}

export default NykaaScraper;
