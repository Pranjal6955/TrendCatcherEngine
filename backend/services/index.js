export class GlobalService {
    async healthCheck() {
        return { status: "OK", timestamp: Date.now() };
    }
}
