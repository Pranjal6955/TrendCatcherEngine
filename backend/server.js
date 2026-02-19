import 'dotenv/config';
import connectDB from "./db/index.js";
import { app } from './app.js';
import { initScheduledJobs } from './jobs/dailyCheck.job.js';

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);

            // Start background cron jobs after server is ready
            initScheduledJobs();
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })

