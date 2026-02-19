export class GlobalController {
    static async healthCheck(req, res, next) {
        try {
            res.status(200).json({ status: "OK", timestamp: Date.now() });
        } catch (error) {
            next(error);
        }
    }
}
