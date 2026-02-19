/**
 * ── Price Scraper Job ──
 * Background async batch processor that:
 *   1. Fetches all active products from DB
 *   2. Scrapes each product URL asynchronously (in batches)
 *   3. Cleans the scraped data
 *   4. Feeds cleaned price into the Watchdog for comparison & storage
 *
 * Runs non-blocking — never stalls the Express API.
 */

import { Product } from "../models/product.model.js";
import ScraperFactory from "../scrapers/scraperFactory.js";
import { cleanPrice, cleanAvailability, cleanTitle } from "../cleaners/index.js";
import { analyzePrice } from "../services/watchdog.service.js";

// ── Config ──
const BATCH_SIZE = 5;           // products scraped concurrently per batch
const DELAY_BETWEEN_BATCHES_MS = 2000;  // breathing room between batches (avoid rate-limits)

/**
 * Sleep utility (non-blocking).
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Scrape a single product and run watchdog analysis.
 * Returns a result object (never throws — errors are caught and reported).
 *
 * @param {Object} product — Mongoose product document (lean)
 * @returns {Object}
 */
const processProduct = async (product) => {
    const startTime = Date.now();

    try {
        // 1. Scrape
        const raw = await ScraperFactory.scrape(product.url);

        // 2. Clean
        const scrapedPrice = cleanPrice(raw.price);
        const scrapedTitle = cleanTitle(raw.title);
        const isAvailable = cleanAvailability(raw.availability);

        // Skip if price came back as 0 (scraper failed silently)
        if (scrapedPrice === 0) {
            return {
                productId: product._id,
                name: product.name,
                status: "SKIPPED",
                reason: "Scraped price was 0 — likely a scraper failure",
                duration: Date.now() - startTime,
            };
        }

        // 3. Watchdog: compare & store
        const watchdogResult = await analyzePrice(product._id.toString(), scrapedPrice);

        return {
            productId: product._id,
            name: product.name,
            status: "SUCCESS",
            priceStatus: watchdogResult.status,
            previousPrice: watchdogResult.previousPrice,
            newPrice: watchdogResult.newPrice,
            priceDifference: watchdogResult.priceDifference,
            percentageChange: watchdogResult.percentageChange,
            available: isAvailable,
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            productId: product._id,
            name: product.name,
            status: "FAILED",
            error: error.message || "Unknown error",
            duration: Date.now() - startTime,
        };
    }
};

/**
 * Split an array into chunks of a given size.
 */
const chunk = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

/**
 * ── Main: Run the full scraper job ──
 *
 * Fetches all active products, processes them in async batches,
 * and returns a full report.
 *
 * @param {Object} options
 * @param {number} options.batchSize — products per batch (default: 5)
 * @param {number} options.delayMs — ms between batches (default: 2000)
 * @returns {Object} — { totalProducts, results, summary, duration }
 */
const runScraperJob = async (options = {}) => {
    const batchSize = options.batchSize || BATCH_SIZE;
    const delayMs = options.delayMs || DELAY_BETWEEN_BATCHES_MS;
    const jobStart = Date.now();

    console.log(`\n🔍 [Scraper Job] Starting at ${new Date().toISOString()}`);

    // 1. Fetch all active products
    const products = await Product.find({ isActive: true }).lean();

    if (products.length === 0) {
        console.log("🔍 [Scraper Job] No active products to scrape.");
        return {
            totalProducts: 0,
            results: [],
            summary: { success: 0, failed: 0, skipped: 0 },
            duration: Date.now() - jobStart,
        };
    }

    console.log(`🔍 [Scraper Job] Found ${products.length} active products. Batch size: ${batchSize}`);

    // 2. Process in batches
    const batches = chunk(products, batchSize);
    const allResults = [];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`   📦 Batch ${i + 1}/${batches.length} — ${batch.length} products`);

        // Run all products in this batch concurrently
        const batchResults = await Promise.all(
            batch.map((product) => processProduct(product))
        );

        allResults.push(...batchResults);

        // Log batch results
        batchResults.forEach((r) => {
            if (r.status === "SUCCESS") {
                console.log(`      ✅ ${r.name} — ${r.priceStatus} (₹${r.previousPrice} → ₹${r.newPrice})`);
            } else if (r.status === "SKIPPED") {
                console.log(`      ⏭️  ${r.name} — ${r.reason}`);
            } else {
                console.log(`      ❌ ${r.name} — ${r.error}`);
            }
        });

        // Delay between batches (skip after the last batch)
        if (i < batches.length - 1) {
            await sleep(delayMs);
        }
    }

    // 3. Build summary
    const summary = {
        success: allResults.filter((r) => r.status === "SUCCESS").length,
        failed: allResults.filter((r) => r.status === "FAILED").length,
        skipped: allResults.filter((r) => r.status === "SKIPPED").length,
    };

    const totalDuration = Date.now() - jobStart;

    console.log(`\n🔍 [Scraper Job] Complete in ${totalDuration}ms`);
    console.log(`   ✅ Success: ${summary.success}  ❌ Failed: ${summary.failed}  ⏭️ Skipped: ${summary.skipped}\n`);

    return {
        totalProducts: products.length,
        results: allResults,
        summary,
        duration: totalDuration,
    };
};

export { runScraperJob, processProduct };
