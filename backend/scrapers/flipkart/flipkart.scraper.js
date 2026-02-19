import BaseScraper from "../base.scraper.js";

class FlipkartScraper extends BaseScraper {
    constructor() {
        super("Flipkart");
    }

    async scrape(url) {
        const $ = await this.fetchPage(url);

        const title =
            $("span.VU-ZEz").first().text().trim() ||
            $("h1.yhB1nd span").first().text().trim() ||
            $(".B_NuCI").text().trim() ||
            "N/A";

        const priceText =
            $("div.Nx9bqj.CxhGGd").first().text().trim() ||
            $("div._30jeq3._16Jk6d").first().text().trim() ||
            $("._30jeq3").first().text().trim() ||
            "0";

        const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

        const availabilityText =
            $("div._16FRp0").text().trim().toLowerCase() || "";
        const availability = !availabilityText.includes("sold out");

        return { title, price, availability };
    }
}

export default FlipkartScraper;
