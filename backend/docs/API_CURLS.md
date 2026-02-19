# 🧪 TrendCatcher Engine — API Curl Cheat Sheet

> **Base URL:** `http://localhost:5000`

---

## 🏠 Health / Root

### Root check
```bash
curl http://localhost:5000/
```

---

## 📦 Products (`/api/products`)

### 1. Add a product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.in/dp/B0EXAMPLE",
    "name": "Example Product"
  }'
```

### 1b. Bulk add multiple products at once
```bash
curl -X POST http://localhost:5000/api/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      { "url": "https://www.amazon.in/dp/B0PRODUCT1", "name": "Product One" },
      { "url": "https://www.amazon.in/dp/B0PRODUCT2", "name": "Product Two" },
      { "url": "https://www.flipkart.com/some-product", "name": "Product Three" }
    ]
  }'
```

### 2. Get all tracked products (with optional pagination & filter)
```bash
# Default (page 1, limit 10)
curl http://localhost:5000/api/products

# With pagination
curl "http://localhost:5000/api/products?page=1&limit=5"

# Filter active only
curl "http://localhost:5000/api/products?isActive=true"
```

### 3. Get price history for a product
```bash
# Replace <PRODUCT_ID> with an actual MongoDB ObjectId
curl "http://localhost:5000/api/products/<PRODUCT_ID>/history"

# With pagination
curl "http://localhost:5000/api/products/<PRODUCT_ID>/history?page=1&limit=10"
```

---

## 🐕 Watchdog (`/api/watchdog`)

### 4. Run a price check
```bash
# Replace <PRODUCT_ID> with an actual MongoDB ObjectId
curl -X POST http://localhost:5000/api/watchdog/check \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<PRODUCT_ID>",
    "newPrice": 1499.00
  }'
```

### 5. Get watchdog summary for a product
```bash
# Replace <PRODUCT_ID> with an actual MongoDB ObjectId
curl http://localhost:5000/api/watchdog/<PRODUCT_ID>/summary
```

---

## ⚙️ Jobs (`/api/jobs`)

### 6. Manually trigger the scraper job
```bash
# Default batch
curl -X POST http://localhost:5000/api/jobs/scrape \
  -H "Content-Type: application/json" \
  -d '{}'

# Custom batch size & delay
curl -X POST http://localhost:5000/api/jobs/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 3,
    "delayMs": 1000
  }'
```

### 7. Get cron job status
```bash
curl http://localhost:5000/api/jobs/status
```

---

## 🚀 Quick Flow (copy-paste sequence)

```bash
# 1️⃣  Health check
curl -s http://localhost:5000/ | jq

# 2️⃣  Add a product
curl -s -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.amazon.in/dp/B0EXAMPLE","name":"Test Product"}' | jq

# 3️⃣  List products (grab the _id from response)
curl -s http://localhost:5000/api/products | jq

# 4️⃣  Price history  (paste the _id below)
curl -s http://localhost:5000/api/products/<PRODUCT_ID>/history | jq

# 5️⃣  Watchdog check
curl -s -X POST http://localhost:5000/api/watchdog/check \
  -H "Content-Type: application/json" \
  -d '{"productId":"<PRODUCT_ID>","newPrice":999}' | jq

# 6️⃣  Watchdog summary
curl -s http://localhost:5000/api/watchdog/<PRODUCT_ID>/summary | jq

# 7️⃣  Trigger scraper
curl -s -X POST http://localhost:5000/api/jobs/scrape \
  -H "Content-Type: application/json" -d '{}' | jq

# 8️⃣  Job status
curl -s http://localhost:5000/api/jobs/status | jq
```

---

> 💡 **Tip:** Pipe any curl through `| jq` for pretty-printed JSON output.  
> Install jq: `sudo apt install jq`
