import BaseScraper from "../base.scraper.js";

class AmazonScraper extends BaseScraper {
    constructor() {
        super("Amazon");
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

        const title =
            $("#productTitle").text().trim() ||
            $("h1.a-size-large span").text().trim() ||
            "N/A";

        const priceText =
            $(".a-price .a-offscreen").first().text().trim() ||
            $("#priceblock_ourprice").text().trim() ||
            $("#priceblock_dealprice").text().trim() ||
            $(".a-price-whole").first().text().trim() ||
            "0";

        const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

        const availability =
            $("#availability span").text().trim().toLowerCase() !==
            "currently unavailable";

        return { title, price, availability };
    }
}

export default AmazonScraper;
