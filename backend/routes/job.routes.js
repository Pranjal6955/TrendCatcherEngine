import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { runScraperJob } from "../jobs/scraper.job.js";
import { getCronStatus, safeScrape } from "../jobs/dailyCheck.job.js";

const router = Router();

/**
 * POST /api/jobs/scrape — Manually trigger the background scraper job.
 * The job runs asynchronously — the API returns immediately with a 202 Accepted.
 */
router.post(
    "/scrape",
    asyncHandler(async (req, res) => {
        const { batchSize, delayMs } = req.body;

        // Fire-and-forget: kick off the job in the background
        runScraperJob({
            batchSize: batchSize || 5,
            delayMs: delayMs || 2000,
        }).catch((err) => {
            console.error("❌ [Manual Job] Scraper job failed:", err.message);
        });

        res.status(202).json({
            success: true,
            message: "Scraper job triggered in background. Check server logs for progress.",
        });
    })
);

/**
 * GET /api/jobs/status — Get the current cron job status and run history.
 */
router.get(
    "/status",
    asyncHandler(async (req, res) => {
        const status = getCronStatus();

        res.status(200).json({
            success: true,
            message: "Cron job status fetched",
            data: status,
        });
    })
);

export default router;
