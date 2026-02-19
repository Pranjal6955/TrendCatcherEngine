import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import productRoutes from './routes/product.routes.js';
import watchdogRoutes from './routes/watchdog.routes.js';
import jobRoutes from './routes/job.routes.js';

const app = express();

// ── Global Middleware ──
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// ── Health Check ──
app.get('/', (req, res) => {
    res.status(200).json({ status: "OK", message: "TrendCatcher API is running" });
});

// ── API Routes ──
app.use('/api/products', productRoutes);
app.use('/api/watchdog', watchdogRoutes);
app.use('/api/jobs', jobRoutes);

// ── Error Handling ──
app.use(notFound);
app.use(errorHandler);

export { app };
