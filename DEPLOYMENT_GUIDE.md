# 🚀 SmartLedger AI ERP — Production Cloud Deployment Guide
### Render ("blender") • Vercel • MongoDB Atlas • Brand New Business Setup

This guide provides end-to-end instructions for deploying SmartLedger AI ERP to **Render.com** (often referred to as "blender"), **Vercel**, and **MongoDB Atlas Cloud**.

The system is architected with a **Universal Native Node.js Machine Learning Engine** alongside the Express API gateway and React SPA frontend, allowing full predictive capabilities (Stacked Bi-LSTM Cashflow, Apriori Basket Mining, Isolation Forest Credit Risk, and Inventory Telemetry) to run seamlessly in pure JavaScript without complex multi-container dependencies.

---

## 🏗️ Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │             User Web Browsers                │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTPS
                ┌────────────────────────────┴──────────────────────────┐
                │                                                       │
  [Option A: Split Deployment]                             [Option B: Unified Deployment]
                │                                                       │
     ┌──────────▼──────────┐                                  ┌─────────▼─────────┐
     │   Vercel Frontend   │                                  │ Render Web Service│
     │   (React 18 + Vite) │                                  │ (SPA + API + ML)  │
     └──────────┬──────────┘                                  └─────────┬─────────┘
                │ /api/*                                                │
     ┌──────────▼──────────┐                                            │
     │  Render Web Service │                                            │
     │  (Node.js / Express)│                                            │
     └──────────┬──────────┘                                            │
                │                                                       │
                └───────────────────────────┬───────────────────────────┘
                                            │ TLS / SRV
                                 ┌──────────▼──────────┐
                                 │ MongoDB Atlas Cloud │
                                 │   (M0 Free Tier)    │
                                 └─────────────────────┘
```

---

## Step 1: Set Up Free MongoDB Atlas Cloud Database

1. **Create Free Account:**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in or register.

2. **Create a Free Cluster:**
   - Click **"Build a Database"** -> Choose the **M0 Free (Shared)** tier.
   - Provider: AWS or Google Cloud.
   - Region: Choose the region nearest to you (e.g., `Mumbai (ap-south-1)`, `N. Virginia (us-east-1)`, or `Frankfurt (eu-central-1)`).
   - Cluster Name: `smartledger-cluster` -> Click **"Create Cluster"**.

3. **Create Database User Credentials:**
   - In **Security** -> **Database Access**: Click **"Add New Database User"**.
   - Authentication Method: **Password**.
   - Username: e.g. `admin_user`.
   - Password: Choose a secure password (e.g. `SmartLedger2026!`). *Avoid special characters like `@` or `/` in password, or URL-encode them.*
   - Database User Privileges: Select **"Read and write to any database"**.
   - Click **"Add User"**.

4. **Configure Network IP Access (Crucial for Cloud Services):**
   - In **Security** -> **Network Access**: Click **"Add IP Address"**.
   - Select **"Allow Access from Anywhere"** (`0.0.0.0/0`).
   - Click **"Confirm"**. *(This allows Render and Vercel cloud servers to connect to your database).*

5. **Copy Your Connection URI:**
   - In **Databases** -> Click **"Connect"** next to your cluster.
   - Select **"Drivers"** (Node.js).
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://admin_user:SmartLedger2026!@smartledger-cluster.xxxxx.mongodb.net/smartledger_erp?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and specify the database name `smartledger_erp`.

6. **Verify the Connection Locally (Optional):**
   - Run the included test utility in your terminal:
     ```bash
     node test_atlas_connection.js "mongodb+srv://admin_user:SmartLedger2026!@smartledger-cluster.xxxxx.mongodb.net/smartledger_erp?retryWrites=true&w=majority"
     ```
   - You should see: `✅ [SUCCESS] Successfully connected to MongoDB!`

---

## Step 2: Deploy Backend to Render ("blender")

Render (`render.com`) is the standard cloud host for full-stack Node.js applications.

### Method A: 1-Click Blueprint Deploy (Recommended)
1. Push your SmartLedger code to a GitHub or GitLab repository.
2. Log in to [render.com](https://render.com).
3. Click **"New +"** (top right) -> Select **"Blueprint"**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/GOBI%20KRISHNA%20V/Downloads/smartledger-ai-mern-stack/render.yaml) in the root of the project!
6. In the environment variables prompt:
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string from Step 1.
   - `START_CLEAN`: Leave as `true` (so you start with a 100% brand new clean slate for your business).
7. Click **"Apply"**. Render will build the React client, package the Node.js backend, and launch your live application!

### Method B: Manual Web Service Deploy on Render
1. In Render Dashboard, click **"New +"** -> **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name:** `smartledger-ai-erp`
   - **Region:** Nearest to your MongoDB Atlas region (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank / default root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`
4. Add **Environment Variables**:
   | Key | Value | Note |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Port handled by Render router |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
   | `JWT_SECRET` | *(Generate a 32-char string)* | e.g. `smartledger_live_jwt_prod_2026` |
   | `START_CLEAN` | `true` | Boots brand new for real user inputs |
   | `AUTO_SEED` | `false` | Prevents fake mock data insertion |
5. Click **"Create Web Service"**.
6. Once deployed, Render provides your public URL (e.g. `https://smartledger-ai-erp.onrender.com`).
   - Open that URL: The complete React web app, REST API, and Socket.io gateway are all live!

---

## Step 3: Deploy Frontend to Vercel (Optional Split Deployment)

If you prefer hosting the React frontend on Vercel's global CDN while having Render host the API:

1. Push your code to GitHub.
2. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository.
4. In Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and select `client` (or use the root `vercel.json` provided).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. In **Environment Variables**:
   - Add `VITE_API_URL` = Your Render backend URL (e.g. `https://smartledger-ai-erp.onrender.com`).
6. Click **"Deploy"**.
7. Vercel automatically deploys the frontend with clean single-page application routing (`vercel.json`) and connects to your Render backend.

---

## Step 4: Starting Brand New with User Inputs

When you deploy in **Brand New Mode** (`START_CLEAN=true`):
The application boots as a pristine, unconfigured enterprise system.

1. **Log in or Register:**
   - Use default master login: `admin@smartledger.ai` / `Admin@123`
   - Or click **Register** to create your own administrative account.
2. **Interactive Business Onboarding Wizard:**
   - Click the **"✨ Set up your business & products"** button in the header, or click **"Launch Setup Wizard"** on the Dashboard.
   - **Step 1:** Enter your real Business Name, Legal Trade Name, Industry Sector, Currency (₹, $, €, £), GSTIN, and State.
   - **Step 2:** Add your first real product SKU, category, selling price, and opening inventory count.
   - **Step 3:** Add your first customer or client profile.
   - **Step 4:** Click **"🚀 Save & Launch My ERP"**.
3. **Dynamic Enterprise Adaptation:**
   - All receipts, POS registers, tax invoices, and reports immediately re-brand to your business name.
   - All monetary figures format in your chosen currency symbol.
   - The AI models (LSTM cash flow forecast, Apriori cross-sell rules, Isolation Forest credit scoring) calibrate directly from your inputs!

---

## Database & Data Mode Management

You can toggle between **Brand New Clean Slate** and **Demo Sample Mode** anytime without redeploying:
- Navigate to **Settings** (`/settings`) -> scroll to **Database & Cloud Deployment Center**.
- **Wipe Demo Data & Start 100% Brand New:** One-click wipe of all test mock records. Your login credentials remain safe.
- **Load Sample Demo Data:** Reloads sample products, customers, and invoices if you want to test features with sample data.
- **Connection Telemetry:** Shows live MongoDB Atlas cluster connection status and document counts.
