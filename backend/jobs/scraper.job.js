/**
 * ── Price Scraper Job (Production-Grade)
 */

import { Product } from "../models/product.model.js";
import ScraperFactory from "../scrapers/scraperFactory.js";
import { cleanPrice, cleanAvailability, cleanTitle } from "../cleaners/index.js";
import { analyzePrice } from "../services/watchdog.service.js";

// ── Defaults (overridable via options) ──
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_DELAY_BETWEEN_BATCHES_MS = 3000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 1000;

// ─────────────────────────────────────────────────────────
//  Utilities
// ─────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Format milliseconds into human-readable string.
 */
const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
};

// ─────────────────────────────────────────────────────────
//  Retry Mechanism
// ─────────────────────────────────────────────────────────

/**
 * Retry a function with exponential backoff.
 *
 * @param {Function} fn — async function to retry
 * @param {number} maxRetries — max attempts (default: 3)
 * @param {number} baseDelay — initial delay in ms (doubles each retry)
 * @returns {*} — result of fn()
 */
const withRetry = async (fn, maxRetries = DEFAULT_MAX_RETRIES, baseDelay = DEFAULT_RETRY_BASE_DELAY_MS) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                await sleep(delay);
            }
        }
    }

    throw lastError;
};

// ─────────────────────────────────────────────────────────
//  Single Product Processor (with retry)
// ─────────────────────────────────────────────────────────

/**
 * Scrape a single product with retry, clean data, and feed into watchdog.
 * Never throws — all errors are caught and returned as a result object.
 *
 * @param {Object} product — lean Mongoose document
 * @param {Object} retryConfig
 * @returns {Object} — result
 */
const processProduct = async (product, retryConfig = {}) => {
    const maxRetries = retryConfig.maxRetries || DEFAULT_MAX_RETRIES;
    const baseDelay = retryConfig.baseDelay || DEFAULT_RETRY_BASE_DELAY_MS;
    const startTime = Date.now();
    let attempts = 0;

    try {
        // 1. Scrape with retry
        const raw = await withRetry(
            async () => {
                attempts++;
                return await ScraperFactory.scrape(product.url);
            },
            maxRetries,
            baseDelay
        );

        // 2. Clean scraped data
        const scrapedPrice = cleanPrice(raw.price);
        const scrapedTitle = cleanTitle(raw.title);
        const isAvailable = cleanAvailability(raw.availability);

        // 3. Skip if price is 0 (scraper failed silently)
        if (scrapedPrice === 0) {
            return {
                productId: product._id,
                name: product.name,
                status: "SKIPPED",
                reason: "Scraped price was 0 — likely a scraper/DOM failure",
                attempts,
                duration: Date.now() - startTime,
            };
        }

        // 4. Watchdog: compare & store
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
            attempts,
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            productId: product._id,
            name: product.name,
            status: "FAILED",
            error: error.message || "Unknown error",
            attempts,
            duration: Date.now() - startTime,
        };
    }
};

// ─────────────────────────────────────────────────────────
//  Main Job Runner
// ─────────────────────────────────────────────────────────

/**
 * Run the full scraper job with production-grade batch processing.
 *
 * @param {Object} options
 * @param {number} options.batchSize       — products per batch (default: 50)
 * @param {number} options.delayMs         — ms between batches (default: 3000)
 * @param {number} options.maxRetries      — retry attempts per product (default: 3)
 * @param {number} options.retryBaseDelay  — base delay for exponential backoff (default: 1000)
 * @returns {Object} — full report
 */
const runScraperJob = async (options = {}) => {
    const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    const delayMs = options.delayMs || DEFAULT_DELAY_BETWEEN_BATCHES_MS;
    const maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
    const retryBaseDelay = options.retryBaseDelay || DEFAULT_RETRY_BASE_DELAY_MS;
    const jobStart = Date.now();

    console.log(`\n${"═".repeat(60)}`);
    console.log(`🔍 [Scraper Job] Starting at ${new Date().toISOString()}`);
    console.log(`   Config: batchSize=${batchSize}, delay=${delayMs}ms, retries=${maxRetries}`);
    console.log(`${"═".repeat(60)}`);

    // ── 1. Fetch all active products ──
    const products = await Product.find({ isActive: true })
        .select("_id name url source currentPrice")
        .lean();

    if (products.length === 0) {
        console.log("🔍 [Scraper Job] No active products to scrape.");
        return {
            totalProducts: 0,
            results: [],
            summary: { success: 0, failed: 0, skipped: 0, retried: 0 },
            duration: Date.now() - jobStart,
        };
    }

    const totalBatches = Math.ceil(products.length / batchSize);
    console.log(`📊 Found ${products.length} active products → ${totalBatches} batches\n`);

    // ── 2. Process in batches ──
    const batches = chunk(products, batchSize);
    const allResults = [];
    let processedCount = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchStart = Date.now();

        console.log(`   📦 Batch ${i + 1}/${totalBatches} — ${batch.length} products`);

        // Run all products in this batch concurrently via Promise.all
        const batchResults = await Promise.all(
            batch.map((product) =>
                processProduct(product, { maxRetries, baseDelay: retryBaseDelay })
            )
        );

        allResults.push(...batchResults);
        processedCount += batch.length;

        // Batch stats
        const batchSuccess = batchResults.filter((r) => r.status === "SUCCESS").length;
        const batchFailed = batchResults.filter((r) => r.status === "FAILED").length;
        const batchSkipped = batchResults.filter((r) => r.status === "SKIPPED").length;
        const batchRetried = batchResults.filter((r) => r.attempts > 1).length;
        const batchDuration = Date.now() - batchStart;

        console.log(
            `      ✅ ${batchSuccess}  ❌ ${batchFailed}  ⏭️ ${batchSkipped}  🔄 ${batchRetried} retried  ⏱️ ${formatDuration(batchDuration)}`
        );

        // Progress & ETA
        const elapsed = Date.now() - jobStart;
        const avgPerProduct = elapsed / processedCount;
        const remaining = products.length - processedCount;
        const eta = formatDuration(Math.round(avgPerProduct * remaining));
        const percent = ((processedCount / products.length) * 100).toFixed(1);

        console.log(
            `      📈 Progress: ${processedCount}/${products.length} (${percent}%)  ETA: ~${eta}`
        );

        // Delay between batches (skip after the last one)
        if (i < batches.length - 1) {
            console.log(`      💤 Cooling down ${delayMs}ms...\n`);
            await sleep(delayMs);
        }
    }

    // ── 3. Build final summary ──
    const summary = {
        success: allResults.filter((r) => r.status === "SUCCESS").length,
        failed: allResults.filter((r) => r.status === "FAILED").length,
        skipped: allResults.filter((r) => r.status === "SKIPPED").length,
        retried: allResults.filter((r) => r.attempts > 1).length,
    };

    const totalDuration = Date.now() - jobStart;

    console.log(`\n${"═".repeat(60)}`);
    console.log(`🔍 [Scraper Job] Complete in ${formatDuration(totalDuration)}`);
    console.log(`   📊 Total    : ${products.length} products`);
    console.log(`   ✅ Success  : ${summary.success}`);
    console.log(`   ❌ Failed   : ${summary.failed}`);
    console.log(`   ⏭️  Skipped : ${summary.skipped}`);
    console.log(`   🔄 Retried  : ${summary.retried}`);
    console.log(`   ⚡ Avg/item : ${formatDuration(Math.round(totalDuration / products.length))}`);
    console.log(`${"═".repeat(60)}\n`);

    return {
        totalProducts: products.length,
        results: allResults,
        summary,
        duration: totalDuration,
    };
};

export { runScraperJob, processProduct, withRetry };
