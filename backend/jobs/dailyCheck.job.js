/**
 * ── Scheduled Jobs (node-cron) ──
 */

import cron from "node-cron";
import { runScraperJob } from "./scraper.job.js";

// ── State ──
let isJobRunning = false;
let cronTask = null;

const jobHistory = [];        // stores last N run summaries
const MAX_HISTORY = 10;

const cronState = {
    schedule: "",
    startedAt: null,
    lastRunAt: null,
    lastRunDuration: null,
    lastRunSummary: null,
    totalRuns: 0,
};

/**
 * Guard wrapper — prevents overlapping runs and tracks history.
 */
const safeScrape = async () => {
    if (isJobRunning) {
        console.log("⚠️  [Cron] Scraper job already running — skipping this cycle.");
        return null;
    }

    isJobRunning = true;
    cronState.lastRunAt = new Date();
    const runStart = Date.now();

    try {
        console.log("\n⏰ [Cron] Triggering scheduled price check...");
        const result = await runScraperJob();

        const duration = Date.now() - runStart;
        cronState.lastRunDuration = duration;
        cronState.lastRunSummary = result.summary;
        cronState.totalRuns++;

        // Push to history (keep last N)
        jobHistory.unshift({
            runAt: cronState.lastRunAt,
            duration,
            totalProducts: result.totalProducts,
            summary: result.summary,
        });
        if (jobHistory.length > MAX_HISTORY) jobHistory.pop();

        return result;
    } catch (error) {
        console.error("❌ [Cron] Scraper job crashed:", error.message);

        jobHistory.unshift({
            runAt: cronState.lastRunAt,
            duration: Date.now() - runStart,
            error: error.message,
        });
        if (jobHistory.length > MAX_HISTORY) jobHistory.pop();

        return null;
    } finally {
        isJobRunning = false;
    }
};

/**
 * Initialize all scheduled jobs.
 * Call once after DB connection is established.
 */
const initScheduledJobs = () => {
    const schedule = process.env.CRON_SCHEDULE || "6 hours";

    // Validate the cron expression
    if (!cron.validate(schedule)) {
        console.error(`❌ [Cron] Invalid cron expression: "6 hours". Falling back to every 6 hours.`);
        cronState.schedule = "0 */6 * * *";
    } else {
        cronState.schedule = schedule;
    }

    cronState.startedAt = new Date();

    // Schedule the task
    cronTask = cron.schedule(cronState.schedule, () => {
        safeScrape();
    });

    console.log(`📅 [Cron] Scheduled jobs initialized`);
    console.log(`   ⏱️  Schedule : ${cronState.schedule}`);
    const formattedTime = cronState.startedAt.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`   🕐 Started  : ${formattedTime} IST`);
};

/**
 * Stop the cron scheduler gracefully.
 */
const stopScheduledJobs = () => {
    if (cronTask) {
        cronTask.stop();
        console.log("🛑 [Cron] Scheduled jobs stopped.");
    }
};

/**
 * Get the current cron job status — used by the status API.
 */
const getCronStatus = () => {
    return {
        isRunning: isJobRunning,
        schedule: cronState.schedule,
        startedAt: cronState.startedAt,
        lastRunAt: cronState.lastRunAt,
        lastRunDuration: cronState.lastRunDuration
            ? `${cronState.lastRunDuration}ms`
            : null,
        lastRunSummary: cronState.lastRunSummary,
        totalRuns: cronState.totalRuns,
        recentHistory: jobHistory,
    };
};

export {
    initScheduledJobs,
    stopScheduledJobs,
    safeScrape,
    getCronStatus,
    isJobRunning,
};
