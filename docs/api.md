# SmartLedger AI ERP — REST & WebSocket API Specification

## 1. Authentication & Base Conventions
- **Base URL**: `http://localhost:5000/api`
- **Security**: JWT Bearer Token passed via HTTP Header: `Authorization: Bearer <token>`
- **Response Format**: Standard JSON envelope:
  ```json
  {
    "status": "success" | "error",
    "data": { ... },
    "message": "Optional status description"
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
Authenticates a staff user by username or email.
- **Request Body**:
  ```json
  { "username": "owner@smartledger.demo", "password": "Owner@123" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOi...",
    "user": {
      "username": "owner_demo",
      "full_name": "Vikramaditya Singhania",
      "email": "owner@smartledger.demo",
      "role": "BUSINESS_OWNER",
      "branch_id": "BR-CENTRAL-01"
    }
  }
  ```

---

## 3. Invoicing & Tax Matrix (`/api/invoices`)

### `POST /api/invoices`
Generates a new tax-compliant invoice, recalculates inventory, posts double-entry ledger entries, and generates a SHA-256 block hash.
- **Request Body**:
  ```json
  {
    "customer_id": "67401a...",
    "items": [
      { "product_id": "67401b...", "quantity": 2, "unit_price": 45000, "hsn_code": "8504" }
    ],
    "payment_method": "UPI",
    "discount_percent": 5,
    "branch_id": "BR-CENTRAL-01"
  }
  ```
- **Response (201 Created)**: Returns saved `invoice` with `crypto_hash`, `prev_hash`, line items, and ledger reference.

### `PATCH /api/invoices/:id/cancel`
Safely voids an existing invoice, restores product stock, posts reversing journal entries, and creates an audit log entry.

---

## 4. Double-Entry General Ledger (`/api/ledger`)

### `GET /api/ledger`
Retrieves paginated ledger entries with query parameters `page`, `limit`, `type`, and `search`.

### `GET /api/ledger/summary`
Returns running balances: `totalDebit`, `totalCredit`, `netBalance`, `totalEntries`.

### `POST /api/ledger/entry`
Posts a manual journal entry adjusting ledger balances.
- **Request Body**:
  ```json
  {
    "account_name": "Office & Warehouse Lease",
    "debit": 45000,
    "credit": 0,
    "transaction_type": "EXPENSE",
    "reference_no": "EXP-2026-03",
    "description": "Monthly depot lease settlement"
  }
  ```

---

## 5. Executive & Statutory Reports (`/api/reports`)

### `GET /api/reports/sales?startDate=...&endDate=...&format=csv|json`
Returns total sales revenue, discounts given, tax collected, and payment method statistics.

### `GET /api/reports/gst?format=csv|json`
Returns GSTR-1 compliant statutory tax liability breakdown (Total Taxable Value, CGST, SGST, IGST).

### `GET /api/reports/inventory?format=csv|json`
Returns inventory retail valuation, cost valuation, unrealized gross margin, and low-stock SKU count.

### `GET /api/reports/customers?format=csv|json`
Returns total outstanding receivables, credit utilization percentage, and overdue aging breakdown.

---

## 6. AI Insights & Telemetry (`/api/insights` & `/api/ai`)

### `GET /api/insights?module=...&severity=...&status=ACTIVE`
Retrieves explainable AI insights filtered by module (CASH_FLOW, INVENTORY, CREDIT_RISK, MARKET_BASKET).

### `POST /api/insights/refresh`
Aggregates real-time intelligence across working capital, inventory velocity, credit default, and market basket synergy.

### `GET /api/ai/models/metrics`
Returns performance telemetry for all 4 ML pipelines (RMSE, MAE, R², F1 score, precision, recall, inference latency).

### `POST /api/ai/retrain`
Triggers on-demand recalibration and weight retraining for all ML pipelines.

---

## 7. Real-Time WebSocket Events (`Socket.io`)

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `stock:low` | Server -> Client | `{ product_name, stock_quantity, reorder_level }` | Broadcast when stock drops to or below reorder threshold |
| `invoice:created` | Server -> Client | `{ invoice_no, customer_name, net_total, crypto_hash }` | Broadcast on new invoice generation |
| `risk:anomaly_flag` | Server -> Client | `{ customer_name, risk_score, flag_level, recommended_action }` | Broadcast when customer payment delay anomaly is detected |
