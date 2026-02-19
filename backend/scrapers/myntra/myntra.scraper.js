import BaseScraper from "../base.scraper.js";

class MyntraScraper extends BaseScraper {
    constructor() {
        super("Myntra");
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

        // Myntra uses heavy JS rendering — try JSON-LD and meta tags first
        let title = "N/A";
        let price = 0;
        let availability = true;

        // Try JSON-LD structured data
        const jsonLd = $('script[type="application/ld+json"]').first().html();
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd);
                title = data.name || title;
                price =
                    parseFloat(data.offers?.price) ||
                    parseFloat(data.offers?.lowPrice) ||
                    price;
                availability =
                    data.offers?.availability !== "https://schema.org/OutOfStock";
            } catch {
                // JSON-LD parse failed, fall through to DOM selectors
            }
        }

        // Fallback: DOM selectors
        if (title === "N/A") {
            title =
                $("h1.pdp-title").text().trim() ||
                $(".pdp-name").text().trim() ||
                "N/A";
        }

        if (price === 0) {
            const priceText =
                $("span.pdp-price strong").text().trim() ||
                $(".pdp-discount-container .pdp-price strong")
                    .text()
                    .trim() ||
                "0";
            price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
        }

        return { title, price, availability };
    }
}

export default MyntraScraper;
