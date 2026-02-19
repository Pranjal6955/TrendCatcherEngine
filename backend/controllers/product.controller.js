import { asyncHandler } from "../utils/asyncHandler.js";
import {
    addProduct,
    getAllProducts,
    getProductPriceHistory,
} from "../services/product.service.js";

// ── 1. POST  /api/products  — Add a product URL ──
const addProductController = asyncHandler(async (req, res) => {
    const { url, name } = req.body;

    if (!url || !name) {
        res.status(400);
        throw new Error("Both 'url' and 'name' fields are required");
    }

    const product = await addProduct(url, name);

    res.status(201).json({
        success: true,
        message: "Product added successfully",
        data: product,
    });
});

// ── 2. GET  /api/products  — Get all tracked products ──
const getAllProductsController = asyncHandler(async (req, res) => {
    const { page, limit, isActive } = req.query;

    const result = await getAllProducts({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
    });

    res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: result.products,
        pagination: result.pagination,
    });
});

// ── 3. GET  /api/products/:id/history  — Get product price history ──
const getProductPriceHistoryController = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await getProductPriceHistory(id, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
    });

    res.status(200).json({
        success: true,
        message: "Price history fetched successfully",
        data: result,
    });
});

export {
    addProductController,
    getAllProductsController,
    getProductPriceHistoryController,
};
