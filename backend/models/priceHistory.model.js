import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
    {
        // ── Reference ──
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },

        // ── Price Snapshot ──
        price: {
            type: Number,
            required: [true, "Price is required"],
        },
        previousPrice: {
            type: Number,
            default: null,
        },
        currency: {
            type: String,
            default: "INR",
        },

        // ── Status ──
        status: {
            type: String,
            enum: ["CHEAPER", "COSTLY", "SAME"],
            required: [true, "Price status is required"],
            index: true,
        },
        priceDifference: {
            type: Number,
            default: 0, // current - previous  (negative = cheaper)
        },
        percentageChange: {
            type: Number,
            default: 0,
        },

        // ── Meta ──
        source: {
            type: String,
            trim: true,
            lowercase: true,
        },
        checkedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index for fast lookups: "all checks for a product, newest first"
priceHistorySchema.index({ product: 1, checkedAt: -1 });

export const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);
