import { Router } from "express";
import {
    checkPriceController,
    getWatchdogSummaryController,
} from "../controllers/watchdog.controller.js";

const router = Router();

// POST  /api/watchdog/check            → Run a price check
router.post("/check", checkPriceController);

// GET   /api/watchdog/:productId/summary  → Get watchdog summary
router.get("/:productId/summary", getWatchdogSummaryController);

export default router;
