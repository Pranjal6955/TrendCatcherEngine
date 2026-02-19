import axios from "axios";
import * as cheerio from "cheerio";
import BaseScraper from "../base.scraper.js";

class FlipkartScraper extends BaseScraper {
    constructor() {
        super("Flipkart");
    }

    /**
     * Override fetchPage — Flipkart needs extra headers to avoid 403.
     */
    async fetchPage(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    Referer: "https://www.google.com/",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "cross-site",
                    "Sec-Fetch-User": "?1",
                    "Upgrade-Insecure-Requests": "1",
                    "Cache-Control": "max-age=0",
                },
                timeout: 20000,
                maxRedirects: 10,
            });
            return cheerio.load(data);
        } catch (error) {
            throw new Error(
                `[${this.name}] Failed to fetch page: ${error.message}`
            );
        }
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

        // ── Title selectors (Flipkart changes these often) ──
        const title =
            $("span.VU-ZEz").first().text().trim() ||
            $("h1.yhB1nd span").first().text().trim() ||
            $(".B_NuCI").text().trim() ||
            $("h1 span").first().text().trim() ||
            $("title").text().split("-")[0].trim() ||
            "N/A";

        // ── Price selectors ──
        const priceText =
            $("div.Nx9bqj.CxhGGd").first().text().trim() ||
            $("div.Nx9bqj").first().text().trim() ||
            $("div._30jeq3._16Jk6d").first().text().trim() ||
            $("._30jeq3").first().text().trim() ||
            "0";

        const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

        // ── Availability ──
        const availabilityText =
            $("div._16FRp0").text().trim().toLowerCase() || "";
        const availability = !availabilityText.includes("sold out");

        return { title, price, availability };
    }
}

export default FlipkartScraper;
