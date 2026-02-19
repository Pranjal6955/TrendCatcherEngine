import { asyncHandler } from "../utils/asyncHandler.js";
import {
    analyzePrice,
    getWatchdogSummary,
} from "../services/watchdog.service.js";

// ── POST /api/watchdog/check — Run a price check for a product ──
const checkPriceController = asyncHandler(async (req, res) => {
    const { productId, newPrice } = req.body;

    if (!productId || newPrice === undefined || newPrice === null) {
        res.status(400);
        throw new Error("Both 'productId' and 'newPrice' are required");
    }

    if (typeof newPrice !== "number" || newPrice < 0) {
        res.status(400);
        throw new Error("'newPrice' must be a non-negative number");
    }

    const result = await analyzePrice(productId, newPrice);

    res.status(200).json({
        success: true,
        message: `Price check complete — status: ${result.status}`,
        data: {
            status: result.status,
            previousPrice: result.previousPrice,
            newPrice: result.newPrice,
            priceDifference: result.priceDifference,
            percentageChange: result.percentageChange,
            historyEntry: result.historyEntry,
        },
    });
});

// ── GET /api/watchdog/:productId/summary — Get watchdog summary ──
const getWatchdogSummaryController = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const summary = await getWatchdogSummary(productId);

    res.status(200).json({
        success: true,
        message: "Watchdog summary fetched",
        data: summary,
    });
});

export { checkPriceController, getWatchdogSummaryController };
