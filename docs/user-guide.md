# SmartLedger AI ERP — User Manual & Operations Guide

## 1. Introduction
This guide provides an end-to-end walkthrough of SmartLedger AI ERP workflows across each authorized stakeholder persona.

---

## 2. Cashier Operations (`/pos`)

### 2.1 Generating a GST-Compliant Invoice
1. **Login**: Sign in with `cashier@smartledger.ai` (Password: `Cashier@123`).
2. **Item Selection**: Use the search input or barcode scanner modal to add products (e.g., *Industrial Solar Core Inverter 5kW*).
3. **AI Cross-Sell Prompt**: Notice the top right panel prompts frequent item associations (e.g., *Copper MC4 PV Cable Drum* with Lift 2.45x). Click **"Add to Cart"** to bundle.
4. **GST Breakdown**: The system automatically computes taxable subtotal, CGST (9%), and SGST (9%) or IGST (18%) depending on state codes.
5. **Payment Method**: Select Cash, UPI, Card, or Trade Credit (if buyer has approved limit).
6. **Finalize Invoice**: Click **"Charge & Print Invoice"**. The system executes:
   - Cryptographic SHA-256 block hash linked to the previous invoice.
   - Real-time stock deduction in MongoDB.
   - Double-entry ledger posting to Revenue and GST Output Liability.
7. **Thermal Receipt**: The modal renders a 58mm/80mm formatted printable invoice with QR code and cryptographic verification digest.

---

## 3. Warehouse Manager Operations (`/warehouse`)

### 3.1 Inventory Control & Expiry Tracking
1. **Login**: Sign in with `warehouse@smartledger.demo` (Password: `Warehouse@123`).
2. **Inventory Stock Status**: View physical on-hand stock, safety reorder thresholds, and batch lot numbers.
3. **Expiry Audits**: Items expiring within 30 days display amber warning badges; expired items display red restriction flags.
4. **Generating Purchase Orders**:
   - For items at or below reorder level (e.g., *Monocrystalline Solar Panel 550W*), click **"Generate PO"**.
   - Select the approved supplier (e.g., *Adani Solar Logistics & Modules*), enter quantity, and submit.
   - Status transitions to `PENDING` -> `APPROVED` -> `DISPATCHED`.

---

## 4. Business Owner Operations (`/owner`, `/ledger`, `/insights`, `/reports`)

### 4.1 Liquidity Forecasting & Risk Control
1. **Login**: Sign in with `owner@smartledger.demo` (Password: `Owner@123`).
2. **Owner Command Dashboard (`/owner`)**:
   - **Bi-LSTM Forecast**: Review the 30-day forecasted daily liquidity chart with 95% upper and lower confidence intervals.
   - **Credit Risk Anomaly Stream**: Review buyers evaluated by the Isolation Forest. Buyers with unpaid ratios > 60% or payment delays > 30 days are flagged.
   - **Executive Overrides**: Click **"Override"** to adjust terms or thaw trade credit lines with an audit log justification.
3. **General Ledger (`/ledger`)**:
   - Inspect double-entry transactions in real-time.
   - Filter by `INVOICE`, `PAYMENT`, `PURCHASE`, `EXPENSE`, or `ADJUSTMENT`.
   - Post manual journal entries via **"Post Journal Entry"**.
4. **AI Insights Command Center (`/insights`)**:
   - Review explainable recommendations synthesized across Cash Flow, Inventory, Credit Risk, and Market Basket.
   - Click **"Execute Action"** to resolve alerts immediately.
5. **Statutory & Executive Reports (`/reports`)**:
   - Export Sales, GSTR-1, Inventory Valuation, and Customer Aging reports in one click as CSV or JSON.

---

## 5. System Administrator Operations (`/models`, `/audit-logs`, `/settings`)

### 5.1 Machine Learning Telemetry (`/models`)
1. **Login**: Sign in with `admin@smartledger.demo` (Password: `Admin@123`).
2. **Inspect Model Accuracy**: Monitor real-time RMSE, MAE, R² score, F1-scores, precision, and latency for all 4 pipelines.
3. **Trigger Recalibration**: Click **"Recalibrate All Models"** to run an on-demand training cycle on new transactional histories.

### 5.2 Compliance Audit Trail (`/audit-logs`)
- Review tamper-evident logs of logins, invoice creation, stock adjustments, and tax rate configuration edits with operator IP addresses and timestamps.
