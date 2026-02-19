import BaseScraper from "../base.scraper.js";

class MeeshoScraper extends BaseScraper {
    constructor() {
        super("Meesho");
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

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
                // fall through
            }
        }

        // Fallback: DOM selectors
        if (title === "N/A") {
            title =
                $("h1.ProductName__ProductTitle").text().trim() ||
                $("span.sc-eDvSVe").first().text().trim() ||
                $('meta[property="og:title"]').attr("content") ||
                "N/A";
        }

        if (price === 0) {
            const priceText =
                $("h4.ProductPrice").text().trim() ||
                $("h5.bJYEpf").text().trim() ||
                $('meta[property="product:price:amount"]').attr("content") ||
                "0";
            price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
        }

        return { title, price, availability };
    }
}

export default MeeshoScraper;
