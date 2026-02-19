
import BaseScraper from "../base.scraper.js";

class MyntraScraper extends BaseScraper {
    constructor() {
        super("Myntra");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            // Navigate
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            // Myntra JS might take a moment
            try {
                await page.waitForSelector(".pdp-price", { timeout: 10000 });
            } catch (e) {
                // Ignore if not immediately found
            }

            const data = await page.evaluate(() => {
                const getTitle = () => {
                    const brand = document.querySelector(".pdp-title")?.innerText.trim() || "";
                    const name = document.querySelector(".pdp-name")?.innerText.trim() || "";
                    return brand && name ? `${brand} ${name}` : document.title;
                };

                const getPrice = () => {
                    const priceEl = document.querySelector(".pdp-price strong") || document.querySelector(".pdp-price");
                    if (priceEl) {
                        return parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
                    }
                    return 0;
                };

                const getAvailability = () => {
                    // Check for "Sold Out" or "Out of Stock" button
                    const buyBtn = document.querySelector(".pdp-add-to-bag");
                    if (buyBtn && buyBtn.classList.contains("pdp-out-of-stock")) {
                        return false;
                    }
                    if (document.body.innerText.toLowerCase().includes("sold out")) {
                        return false;
                    }
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

export default MyntraScraper;
