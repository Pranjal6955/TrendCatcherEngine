import { Router } from "express";
import {
    addProductController,
    bulkAddProductsController,
    getAllProductsController,
    getProductPriceHistoryController,
} from "../controllers/product.controller.js";

const router = Router();

// POST   /api/products          → Add a product URL
router.post("/", addProductController);

// POST   /api/products/bulk     → Add multiple product URLs at once
router.post("/bulk", bulkAddProductsController);

// GET    /api/products          → Get all tracked products
router.get("/", getAllProductsController);

// GET    /api/products/:id/history  → Get price history for a product
router.get("/:id/history", getProductPriceHistoryController);

export default router;
