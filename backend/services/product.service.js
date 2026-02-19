import { Product } from "../models/product.model.js";
import { PriceHistory } from "../models/priceHistory.model.js";

// ── Helper: extract hostname from URL ──
const extractSource = (url) => {
    try {
        const hostname = new URL(url).hostname.replace("www.", "");
        return hostname;
    } catch {
        return "unknown";
    }
};

// ── 1. Add a new product URL ──
const addProduct = async (url, name) => {
    // Check if product already exists
    const existingProduct = await Product.findOne({ url });
    if (existingProduct) {
        throw { statusCode: 409, message: "Product URL already being tracked" };
    }

    const source = extractSource(url);

    const product = await Product.create({
        name,
        url,
        source,
        currentPrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        averagePrice: 0,
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

export { addProduct, getAllProducts, getProductPriceHistory };
