import { Product } from "../models/product.model.js";
import { PriceHistory } from "../models/priceHistory.model.js";
import ScraperFactory from "../scrapers/scraperFactory.js";

// ── Helper: extract hostname from URL ──
const extractSource = (url) => {
    try {
        const hostname = new URL(url).hostname.replace("www.", "");
        return hostname;
    } catch {
        return "unknown";
    }
};

// ── Helper: extract product name from URL slug ──
const extractNameFromURL = (url) => {
    try {
        const pathname = new URL(url).pathname;
        // Most e-commerce URLs: /product-name-slug/p/id or /product-name-slug/...
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
            // Pick the first meaningful slug (skip short IDs like "p", "dp", "s")
            const slug = segments.find((s) => s.length > 3 && !/^(p|dp|s|buy|itm|pid)$/i.test(s));
            if (slug) {
                return slug
                    .replace(/[-_]/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                    .trim();
            }
        }
    } catch { }
    return "Unknown Product";
};

// ── 1. Add a new product URL ──
const addProduct = async (url, name) => {
    // Check if product already exists
    const existingProduct = await Product.findOne({ url });
    if (existingProduct) {
        throw { statusCode: 409, message: "Product URL already being tracked" };
    }

    const source = extractSource(url);

    // Auto-scrape product details from the URL
    let scrapedTitle = "Unknown Product";
    let scrapedPrice = 0;
    let scrapedAvailability = true;

    try {
        console.log(`🔍 [AddProduct] Scraping product details from: ${url}`);
        const scraped = await ScraperFactory.scrape(url);
        scrapedTitle = scraped.title || "Unknown Product";
        scrapedPrice = scraped.price || 0;
        scrapedAvailability = scraped.availability ?? true;
        console.log(`✅ [AddProduct] Scraped → "${scrapedTitle}" | ₹${scrapedPrice}`);
    } catch (err) {
        console.warn(`⚠️  [AddProduct] Scraping failed: ${err.message}. Using fallback values.`);
    }

    // Priority: user-provided name > scraped title > URL slug fallback
    const productName = name || (scrapedTitle !== "Unknown Product" && scrapedTitle !== "N/A" ? scrapedTitle : extractNameFromURL(url));

    const product = await Product.create({
        name: productName,
        url,
        source,
        currentPrice: scrapedPrice,
        highestPrice: scrapedPrice,
        lowestPrice: scrapedPrice > 0 ? scrapedPrice : 0,
        averagePrice: scrapedPrice,
        isActive: scrapedAvailability,
    });

    return product;
};

// ── 2. Get all tracked products ──
const getAllProducts = async ({ page = 1, limit = 10, isActive }) => {
    const query = {};
    if (isActive !== undefined) {
        query.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(query),
    ]);

    return {
        products,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ── 3. Get price history for a product ──
const getProductPriceHistory = async (productId, { page = 1, limit = 20 }) => {
    // Verify the product exists
    const product = await Product.findById(productId).lean();
    if (!product) {
        throw { statusCode: 404, message: "Product not found" };
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
        PriceHistory.find({ product: productId })
            .sort({ checkedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        PriceHistory.countDocuments({ product: productId }),
    ]);

    return {
        product,
        history,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ── 4. Bulk add multiple product URLs ──
const bulkAddProducts = async (products) => {
    const results = { added: [], failed: [] };

    for (const item of products) {
        try {
            const product = await addProduct(item.url, item.name);
            results.added.push({
                name: item.name,
                url: item.url,
                _id: product._id,
            });
        } catch (error) {
            results.failed.push({
                name: item.name,
                url: item.url,
                reason: error.message || "Unknown error",
            });
        }
    }

    return results;
};

export { addProduct, bulkAddProducts, getAllProducts, getProductPriceHistory };
