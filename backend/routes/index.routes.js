import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
    res.status(200).json({ message: "OK", timestamp: new Date(), service: "TrendCatcher Backend" });
});

export default router;
