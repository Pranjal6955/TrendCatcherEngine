import BaseScraper from "../base.scraper.js";

class AjioScraper extends BaseScraper {
    constructor() {
        super("Ajio");
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

        let title = "N/A";
        let price = 0;
        let availability = true;

        // Try JSON-LD structured data first (Ajio often embeds it)
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
                // JSON-LD parse failed, fall through
            }
        }

        // Fallback: DOM selectors
        if (title === "N/A") {
            title =
                $("h1.prod-name").text().trim() ||
                $(".prod-header-section h1").text().trim() ||
                "N/A";
        }

        if (price === 0) {
            const priceText =
                $(".prod-sp").first().text().trim() ||
                $(".prod-price .prod-sp").first().text().trim() ||
                "0";
            price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
        }

        return { title, price, availability };
    }
}

export default AjioScraper;
