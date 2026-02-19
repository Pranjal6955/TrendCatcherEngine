
import BaseScraper from "../base.scraper.js";

class FlipkartScraper extends BaseScraper {
    constructor() {
        super("Flipkart");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            // Flipkart specific headers
            await page.setExtraHTTPHeaders({
                "Referer": "https://www.google.com/"
            });

            // Navigate
            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            // Check for Captcha or Block
            const title = await page.title();
            if (title.includes("Something is wrong") || title.includes("reCAPTCHA") || title.includes("Login")) {
                throw new Error("Blocked by Flipkart (CAPTCHA/Login wall)");
            }

            // Wait for price selector
            const priceSelector = "div.Nx9bqj.CxhGGd, div._30jeq3._16Jk6d, div._30jeq3";
            try {
                await page.waitForSelector(priceSelector, { timeout: 15000 });
            } catch (e) {
                // Ignore timeout
            }

            // Extract data
            const data = await page.evaluate(() => {
                const getTitle = () => {
                    const h1 = document.querySelector("span.VU-ZEz") || document.querySelector("h1.yhB1nd span");
                    return h1 ? h1.innerText.trim() : document.title.split("-")[0].trim();
                };

                const getPrice = () => {
                    const priceEl = document.querySelector("div.Nx9bqj.CxhGGd") ||
                        document.querySelector("div._30jeq3._16Jk6d") ||
                        document.querySelector("div._30jeq3");
                    if (priceEl) {
                        return parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
                    }
                    return 0;
                };

                const getAvailability = () => {
                    const outOfStockDiv = document.querySelector("div._16FRp0") || document.querySelector(".sold-out-err-text");
                    if (outOfStockDiv && outOfStockDiv.innerText.toLowerCase().includes("sold out")) return false;

                    const notifyBtn = document.querySelector("button._2KpZ6l._2U9uOA._3v1-ww");
                    if (notifyBtn && notifyBtn.innerText.toLowerCase().includes("notify")) return false;

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
            throw new Error(`[${this.name}] Failed to scrape page: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
    }
}

export default FlipkartScraper;
