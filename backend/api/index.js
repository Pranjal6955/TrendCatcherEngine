import 'dotenv/config';
import connectDB from "../db/index.js";
import { app } from '../app.js';

// Connect to MongoDB once (cached across warm invocations)
let isConnected = false;

const ensureConnection = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

// Vercel serverless handler — connect to DB on first request
export default async function handler(req, res) {
    await ensureConnection();
    return app(req, res);
}
