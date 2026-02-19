import BaseScraper from "../base.scraper.js";

class SnapdealScraper extends BaseScraper {
    constructor() {
        super("Snapdeal");
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

        const title =
            $("h1.pdp-e-i-head").text().trim() ||
            $("h1[itemprop='name']").text().trim() ||
            $('meta[property="og:title"]').attr("content") ||
            "N/A";

        const priceText =
            $("span.payBlkBig").text().trim() ||
            $("span[itemprop='price']").text().trim() ||
            "0";

        const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

        const availabilityText =
            $(".sold-out-err-text").text().trim().toLowerCase() || "";
        const availability = !availabilityText.includes("sold out");

        return { title, price, availability };
    }
}

export default SnapdealScraper;
