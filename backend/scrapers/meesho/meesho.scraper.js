
import BaseScraper from "../base.scraper.js";

class MeeshoScraper extends BaseScraper {
    constructor() {
        super("Meesho");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            try {
                // Wait for product details block
                await page.waitForSelector("div[class*='ProductDescription']", { timeout: 10000 });
            } catch (e) {
                // Ignore
            }

            const data = await page.evaluate(() => {
                const getTitle = () => {
                    const h4 = document.querySelector("h4[class*='ProductListingTitle']");
                    if (h4) return h4.innerText.trim();
                    return document.body.querySelector("h1")?.innerText.trim() || document.title;
                };

                const getPrice = () => {
                    // Looks for h4 which starts with "₹" often
                    const potentialPrices = Array.from(document.querySelectorAll("h4"));
                    for (const p of potentialPrices) {
                        const text = p.innerText.trim();
                        if (text.startsWith("₹") && text.length < 20) {
                            return parseFloat(text.replace(/[^0-9.]/g, ""));
                        }
                    }
                    return 0;
                };

                const getAvailability = () => {
                    const btn = document.querySelector("button");
                    if (btn && btn.innerText.toLowerCase().includes("sold out")) return false;
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

export default MeeshoScraper;
