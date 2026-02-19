
import BaseScraper from "../base.scraper.js";

class AmazonScraper extends BaseScraper {
    constructor() {
        super("Amazon");
    }

    async scrape(url) {
        let browser = null;
        try {
            browser = await this.launchBrowser();
            const page = await this.createPage(browser);

            // Amazon specific headers (override base if needed, but append actually)
            await page.setExtraHTTPHeaders({
                "Referer": "https://www.amazon.in/"
            });

            // Navigate
            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            // Check for Captcha
            const title = await page.title();
            if (title.includes("Robot Check") || title.includes("CAPTCHA")) {
                throw new Error("Blocked by Amazon (CAPTCHA)");
            }

            // Wait for critical selector
            const priceSelector = "#corePriceDisplay_desktop_feature_div, #corePrice_feature_div, .a-price";
            try {
                await page.waitForSelector(priceSelector, { timeout: 10000 });
            } catch (e) {
                // Ignore
            }

            const data = await page.evaluate(() => {
                const getTitle = () => {
                    const el = document.getElementById("productTitle");
                    return el ? el.innerText.trim() : document.title;
                };

                const getPrice = () => {
                    const priceWhole = document.querySelector(".a-price-whole");
                    if (priceWhole) {
                        const fraction = document.querySelector(".a-price-fraction");
                        let p = priceWhole.innerText.replace(/[^0-9]/g, "");
                        if (fraction) p += "." + fraction.innerText.trim();
                        return parseFloat(p);
                    }

                    const offscreen = document.querySelector(".a-price .a-offscreen");
                    if (offscreen) return parseFloat(offscreen.innerText.replace(/[^0-9.]/g, ""));

                    const dealPrice = document.querySelector("#priceblock_dealprice") || document.querySelector("#priceblock_ourprice");
                    if (dealPrice) return parseFloat(dealPrice.innerText.replace(/[^0-9.]/g, ""));

                    return 0;
                };

                const getAvailability = () => {
                    const avail = document.getElementById("availability");
                    if (avail) {
                        const text = avail.innerText.toLowerCase();
                        if (text.includes("currently unavailable") || text.includes("out of stock")) return false;
                    }
                    return true;
                };

                return {
                    title: getTitle(),
                    price: getPrice(),
                    availability: getAvailability()
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

export default AmazonScraper;
