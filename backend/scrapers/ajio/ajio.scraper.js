
import BaseScraper from "../base.scraper.js";

class AjioScraper extends BaseScraper {
    constructor() {
        super("Ajio");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            // Wait for product details
            try {
                await page.waitForSelector(".prod-price-section", { timeout: 10000 });
            } catch (e) {
                // Ignore
            }

            const data = await page.evaluate(() => {
                const getTitle = () => {
                    const brand = document.querySelector(".prod-name")?.innerText.trim() || "";
                    const desc = document.querySelector(".prod-desc")?.innerText.trim() || "";
                    if (brand && desc) return `${brand} ${desc}`;
                    return document.querySelector("h1")?.innerText.trim() || document.title;
                };

                const getPrice = () => {
                    // Ajio price: <div class="prod-sp">₹1,299</div>
                    const priceEl = document.querySelector(".prod-sp") || document.querySelector(".prod-price-section span");
                    if (priceEl) {
                        return parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
                    }
                    return 0;
                };

                const getAvailability = () => {
                    // Check for "Sold Out" badge or button disabled
                    if (document.body.innerText.toLowerCase().includes("sold out")) return false;
                    const addToBag = document.querySelector(".btn-gold");
                    if (addToBag && addToBag.disabled) return false;
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

export default AjioScraper;
