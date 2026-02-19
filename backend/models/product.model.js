import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        // ── Identity ──
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            index: true,
        },
        url: {
            type: String,
            required: [true, "Product URL is required"],
            unique: true,
            trim: true,
        },


        // ── Current State ──
        currentPrice: {
            type: Number,
            default: 0,
        },
        highestPrice: {
            type: Number,
            default: 0,
        },
        lowestPrice: {
            type: Number,
            default: Infinity,
        },
        averagePrice: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },

        // ── Source & Category ──
        source: {
            type: String,
            required: [true, "Product source is required"],
            trim: true,
            lowercase: true,
            index: true,
        },


        // ── Tracking Meta ──
        totalChecks: {
            type: Number,
            default: 0,
        },
        lastCheckedAt: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
