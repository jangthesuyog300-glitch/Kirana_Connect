# 🛒 Kirana Connect

A powerful hyperlocal grocery marketplace connecting customers with nearby kirana stores in real-time.

[![Technical Docs](https://img.shields.io/badge/Documentation-Technical-blue)](TECHNICAL_DOCS.md)

---

## 📂 Project Structure

This monorepo consists of three core components:

| Component | Description | Tech Stack |
| :--- | :--- | :--- |
| [**`backend/`**](file:///c:/Users/VICTUS/Desktop/Kirana%20App/backend) | REST API & Real-time Server | Node.js, Express, Socket.io, PostgreSQL |
| [**`customer-app/`**](file:///c:/Users/VICTUS/Desktop/Kirana%20App/customer-app) | Mobile app for Customers | React Native (Expo), Zustand |
| [**`store-app/`**](file:///c:/Users/VICTUS/Desktop/Kirana%20App/store-app) | Mobile app for Store Owners | React Native (Expo), Expo Router |

---

## 🚀 Quick Start

### 1. Database Setup
1. Create a Supabase project or local PostgreSQL database.
2. Execute migrations: `backend/src/db/migrations/`
3. Update `backend/.env` with your `DATABASE_URL`.

### 2. Backend Initialization
```bash
cd backend
npm install
npm run seed  # Optional: Seed dummy data
npm run dev
```

### 3. Launching Mobile Apps
Open two terminal windows:
```bash
# Customer App
cd customer-app && npm install && npm run start

# Store App
cd store-app && npm install && npm run start
```

---

## ✨ Key Features

- **📍 Geospatial Search**: Discover stores within a specific radius using PostGIS.
- **⚡ Real-time Sync**: Instant order updates via WebSockets.
- **🛡️ Secure Auth**: OTP-based login for a frictionless mobile experience.
- **📊 Business Insights**: Financial reports and commission tracking for owners.
- **📦 Inventory Control**: Link store items to a master catalog or create custom products.

---

For deep dives into the architecture, API, and workflows, please refer to the [**Technical Documentation**](TECHNICAL_DOCS.md).

*Built with ❤️ using React Native, Expo, Node.js, and Supabase.*
