
import BaseScraper from "../base.scraper.js";

class SnapdealScraper extends BaseScraper {
    constructor() {
        super("Snapdeal");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            try {
                await page.waitForSelector(".pdp-e-i-PAY-r", { timeout: 10000 });
            } catch (e) {
                // Ignore
            }

            const data = await page.evaluate(() => {
                const getTitle = () => {
                    return document.querySelector("h1.pdp-e-i-head")?.innerText.trim() || document.title;
                };

                const getPrice = () => {
                    // .payBlkBig or .pdp-e-i-PAY-r
                    const priceEl = document.querySelector(".payBlkBig") || document.querySelector(".pdp-e-i-PAY-r");
                    if (priceEl) {
                        return parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
                    }
                    return 0;
                };

                const getAvailability = () => {
                    const soldOut = document.querySelector(".sold-out-err");
                    if (soldOut && soldOut.style.display !== "none") return false;
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

export default SnapdealScraper;
