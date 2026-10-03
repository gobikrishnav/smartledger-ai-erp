# SmartLedger AI ERP — Installation & Setup Guide

## 1. Prerequisites
Ensure the following runtimes are installed on your host system:
- **Node.js**: `v18.x` or later (tested on Node.js v24)
- **Python**: `3.10` or later (tested on Python 3.13)
- **MongoDB**: Community Edition running locally on `localhost:27017`
- **Git**: Version control

---

## 2. Environment Variables Configuration

### Backend Gateway (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartledger_db
JWT_SECRET=smartledger_erp_master_secret_2026
AI_SERVICE_URL=http://localhost:8000
```

---

## 3. Step-by-Step Local Execution

### Step 1: Start Python AI Microservice (Port 8000)
Open a new terminal session:
```bash
cd ai-services
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Verify health: Navigate to `http://localhost:8000/api/ai/health`.

### Step 2: Start Node.js Backend Gateway (Port 5000)
Open a second terminal session:
```bash
cd backend
npm install
node server.js
```
*Note: The server will automatically connect to MongoDB and seed the enterprise database with demonstration users, suppliers, ledger records, and AI insights.*

### Step 3: Start React Vite Frontend (Port 5173)
Open a third terminal session:
```bash
cd client
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Access the application at `http://localhost:5173`.

---

## 4. Master Demo User Credentials

The database is pre-seeded with authenticated demonstration accounts for each enterprise stakeholder:

| Role | Username / Email | Password | Primary Console |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `owner@smartledger.demo` | `Owner@123` | `/owner` & Full Deep ERP |
| **Warehouse Manager** | `warehouse@smartledger.demo` | `Warehouse@123` | `/warehouse` & Inventory |
| **System Administrator** | `admin@smartledger.demo` | `Admin@123` | Full Superuser Access |
| **Cashier / POS Terminal** | `cashier@smartledger.ai` | `Cashier@123` | `/pos` High-Speed Invoicing |

---

## 5. Production Build Verification
To compile the client for production deployment:
```bash
cd client
npm run build
```
Build output is saved to `client/dist/` ready for Nginx or static CDN distribution.
