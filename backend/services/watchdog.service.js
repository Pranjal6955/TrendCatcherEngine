/**
 * ── Watchdog Service ──
 * Detects price changes for tracked products.
 *
 * Flow:
 *   1. Fetch the product's current (previous) price from DB
 *   2. Compare with the newly scraped price
 *   3. Determine status: CHEAPER / COSTLY / SAME
 *   4. Store the result in PriceHistory
 *   5. Update the Product's current state (price stats, check count)
 */

import { Product } from "../models/product.model.js";
import { PriceHistory } from "../models/priceHistory.model.js";

// ── Status Constants ──
const STATUS = {
    CHEAPER: "CHEAPER",
    COSTLY: "COSTLY",
    SAME: "SAME",
};

/**
 * Compare two prices and return a status string.
 * @param {number} newPrice
 * @param {number} previousPrice
 * @returns {"CHEAPER" | "COSTLY" | "SAME"}
 */
const comparePrice = (newPrice, previousPrice) => {
    if (previousPrice === 0 || previousPrice === null) return STATUS.SAME; // first check
    if (newPrice < previousPrice) return STATUS.CHEAPER;
    if (newPrice > previousPrice) return STATUS.COSTLY;
    return STATUS.SAME;
};

/**
 * Calculate percentage change between two prices.
 * @param {number} newPrice
 * @param {number} previousPrice
 * @returns {number} — e.g. -12.5 means 12.5% cheaper
 */
const calcPercentageChange = (newPrice, previousPrice) => {
    if (previousPrice === 0 || previousPrice === null) return 0;
    return parseFloat((((newPrice - previousPrice) / previousPrice) * 100).toFixed(2));
};

/**
 * Recalculate average price for a product using all history entries.
 * Uses a running calculation: ((oldAvg * (n-1)) + newPrice) / n
 * @param {number} currentAvg
 * @param {number} totalChecks — count BEFORE this check
 * @param {number} newPrice
 * @returns {number}
 */
const calcRunningAverage = (currentAvg, totalChecks, newPrice) => {
    if (totalChecks === 0) return newPrice;
    return parseFloat((((currentAvg * totalChecks) + newPrice) / (totalChecks + 1)).toFixed(2));
};

/**
 * ── Main: Analyze a price check for a product ──
 *
 * @param {string} productId  — MongoDB ObjectId of the product
 * @param {number} newPrice   — The freshly scraped price (already cleaned)
 * @returns {Object} — { status, priceDifference, percentageChange, historyEntry, updatedProduct }
 */
const analyzePrice = async (productId, newPrice) => {
    // 1. Fetch the product
    const product = await Product.findById(productId);
    if (!product) {
        throw { statusCode: 404, message: "Product not found" };
    }

    const previousPrice = product.currentPrice;

    // 2. Compare prices
    const status = comparePrice(newPrice, previousPrice);
    const priceDifference = parseFloat((newPrice - previousPrice).toFixed(2));
    const percentageChange = calcPercentageChange(newPrice, previousPrice);

    // 3. Store in PriceHistory
    const historyEntry = await PriceHistory.create({
        product: product._id,
        price: newPrice,
        previousPrice,
        currency: product.currency,
        status,
        priceDifference,
        percentageChange,
        source: product.source,
        checkedAt: new Date(),
    });

    // 4. Update Product's current state
    const newAverage = calcRunningAverage(product.averagePrice, product.totalChecks, newPrice);

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            currentPrice: newPrice,
            highestPrice: Math.max(product.highestPrice, newPrice),
            lowestPrice: Math.min(product.lowestPrice, newPrice),
            averagePrice: newAverage,
            lastCheckedAt: new Date(),
            $inc: { totalChecks: 1 },
        },
        { new: true }
    );

    // 5. Return full result
    return {
        status,
        previousPrice,
        newPrice,
        priceDifference,
        percentageChange,
        historyEntry,
        updatedProduct,
    };
};

/**
 * ── Bulk: Analyze prices for all active products ──
 * Useful for cron jobs / batch processing.
 *
 * @param {Array<{ productId: string, newPrice: number }>} checks
 * @returns {Array<Object>} — results for each product
 */
const analyzeBulk = async (checks) => {
    const results = [];

    for (const { productId, newPrice } of checks) {
        try {
            const result = await analyzePrice(productId, newPrice);
            results.push({ productId, success: true, ...result });
        } catch (error) {
            results.push({
                productId,
                success: false,
                error: error.message || "Unknown error",
            });
        }
    }

    return results;
};

/**
 * ── Get the latest watchdog summary for a product ──
 *
 * @param {string} productId
 * @returns {Object} — { product, lastCheck, stats }
 */
const getWatchdogSummary = async (productId) => {
    const product = await Product.findById(productId).lean();
    if (!product) {
        throw { statusCode: 404, message: "Product not found" };
    }

    // Last 2 checks for comparison
    const recentChecks = await PriceHistory.find({ product: productId })
        .sort({ checkedAt: -1 })
        .limit(2)
        .lean();

    // Count of each status
    const statusCounts = await PriceHistory.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = {
        totalChecks: product.totalChecks,
        currentPrice: product.currentPrice,
        highestPrice: product.highestPrice,
        lowestPrice: product.lowestPrice,
        averagePrice: product.averagePrice,
        statusBreakdown: statusCounts.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {}),
    };

    return {
        product,
        lastCheck: recentChecks[0] || null,
        previousCheck: recentChecks[1] || null,
        stats,
    };
};

export {
    analyzePrice,
    analyzeBulk,
    getWatchdogSummary,
    comparePrice,
    calcPercentageChange,
    STATUS,
};
