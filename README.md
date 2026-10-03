# SmartLedger AI ERP — Enterprise Ledger & Intelligent POS System

Production-ready, decoupled monorepo enterprise ERP featuring high-speed POS, real-time GST computation, cryptographic SHA-256 block ledger chaining, warehouse batch/expiry auditing, automated purchase orders, and a dedicated Python AI/ML microservice for deep predictive analytics.

---

## 🏗️ Architecture Overview

The system is decoupled into three core high-performance microservices:

1. **Frontend Client (`client/`)**
   - Built with **React 19 + Vite 8** in a crisp, modern light-mode design system.
   - 3 Specialized Stakeholder Consoles:
     - **Cashier POS (`/pos`)**: High-speed item search, barcode gun scanner, real-time Apriori cross-sell recommendations, dynamic GST matrix, and printable thermal receipt modal with SHA-256 block hash signatures and GPS geo-tokens.
     - **Warehouse Manager Terminal (`/warehouse`)**: Real-time SKU inventory tracking, shelf-life and expiry risk audits (<30d & expired batches), Goods Received Note (GRN) inward shipment logging, and 1-click automated supplier PO dispatch.
     - **Business Owner AI Cockpit (`/owner`)**: 30-day interactive Stacked-Bi-LSTM cashflow forecast chart with 95% confidence variance bands, Isolation Forest credit default risk anomaly stream, customer credit override drawer, and AI model retraining trigger.
   - Real-time event notifications and stock alerts via **Socket.io**.
   - Running on: `http://localhost:5173`

2. **Backend API & Real-Time Gateway (`backend/`)**
   - Built with **Node.js, Express, and Socket.io** with 5NF Mongoose models.
   - Features:
     - **GST Statutory Engine (`gstEngine.js`)**: Dynamic 0%, 5%, 12%, 18%, 28% GST split into CGST+SGST (intra-state) or IGST (inter-state) based on state geo-tokens.
     - **Cryptographic Hash Engine (`cryptoHash.js`)**: SHA-256 immutable block chaining linking every invoice to the previous transaction's hash.
     - **Automated Stock Deductions**: Deducts stock at point of sale and triggers automated reorder POs when below safety thresholds.
     - **Role-Based Access Control (RBAC)**: JWT authentication protecting endpoints for `CASHIER`, `WAREHOUSE_MGR`, and `BUSINESS_OWNER`.
   - Running on: `http://localhost:5000`

3. **Python AI & Machine Learning Microservice (`ai-services/`)**
   - Built with **FastAPI, PyTorch, Scikit-Learn, and mlxtend**.
   - 3 Machine Learning Pipelines:
     - **Bi-Directional Stacked LSTM (`lstm_forecast.py`)**: 30-day forward cash flow and revenue projection with confidence intervals trained on historical ledger revenue.
     - **Isolation Forest Classifier (`anomaly_detector.py`)**: Unsupervised anomaly detection scoring customer credit risk and payment default probabilities.
     - **Apriori Association Engine (`apriori_engine.py`)**: Frequent itemset mining generating high-affinity cross-sell recommendations (sorted by lift and confidence) for real-time POS upsells.
   - Running on: `http://localhost:8000`

---

## 🚀 Quick Start & Local Execution

### Option A: Running All Services Locally (Recommended)

1. **Start MongoDB**:
   Ensure MongoDB Community Server is active on default port `27017`.

2. **Start the Python AI Microservice (Port 8000)**:
   ```bash
   cd ai-services
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Start the Node.js Backend Gateway (Port 5000)**:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   *(On first run, this automatically seeds demo staff accounts, catalog SKUs, customers, and genesis hash chains).*

4. **Start the React Frontend (Port 5173)**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

5. Open your browser and navigate to:
   - **Cashier POS**: [http://localhost:5173/pos](http://localhost:5173/pos)
   - **Warehouse Terminal**: [http://localhost:5173/warehouse](http://localhost:5173/warehouse)
   - **Owner AI Cockpit**: [http://localhost:5173/owner](http://localhost:5173/owner)

---

### Option B: Docker Compose (One-Click)

Launch the entire ecosystem (MongoDB, AI Microservice, Node.js Gateway, and Nginx Client) with a single command:

```bash
docker-compose up --build
```

---

## 🔑 Demo Role Credentials & 1-Click Switcher

You can switch between all 3 stakeholder roles instantly using the top navigation pill switcher, or log in manually:

| Stakeholder Role | Username | Password | Default Route | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Cashier** | `cashier1` | `Cashier@123` | `/pos` | Fast billing, barcode scans, AI cross-sell, thermal checkout |
| **Warehouse Manager** | `warehouse1` | `Warehouse@123` | `/warehouse` | Batch tracking, expiry audits, inward GRN, auto PO dispatch |
| **Business Owner** | `owner1` | `Owner@123` | `/owner` | 30d LSTM forecast, credit risk anomalies, credit overrides, AI retrain |

---

## 📡 Microservice Health Checks

- Backend Gateway: `GET http://localhost:5000/api/health`
- Python AI Microservice: `GET http://localhost:8000/health`
- Frontend Terminal: `http://localhost:5173/`

---
*SmartLedger AI ERP — Production-Grade MERN + PyTorch Ecosystem*

