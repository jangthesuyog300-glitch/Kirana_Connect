# Kirana Connect — Technical Documentation

Kirana Connect is a hyperlocal grocery marketplace platform that connects local Kirana (grocery) stores with customers. The system provides real-time order tracking, inventory management, and a seamless shopping experience for users while empowering store owners with digital tools to manage their business.

---

## 🏗 System Architecture

The project follows a modern client-server architecture:

- **Backend**: Node.js & Express REST API with PostgreSQL for data persistence. Socket.io is used for real-time order status updates and notifications.
- **Customer App**: A cross-platform mobile application built with React Native (Expo) and Expo Router.
- **Store App**: A dedicated mobile application for store owners to manage inventory and fulfill orders.

---

## 🛠 Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express, PostgreSQL, Socket.io, JWT, PostGIS |
| **Database** | PostgreSQL + PostGIS (Geospatial queries) |
| **Mobile (Customer)** | React Native (Expo), Expo Router, Zustand, Axios |
| **Mobile (Store)** | React Native (Expo), Expo Router, Zustand, Axios |
| **Auth** | JWT (JSON Web Tokens), OTP-based Login |
| **Infrastructure** | Docker, Docker Compose |

---

## 🗄 Database Schema

The database is built on PostgreSQL with several key entities:

### Core Tables
- **`users`**: Stores customer and store owner profiles (phone, role, email).
- **`stores`**: Contains store details, location (PostGIS Point), owner reference, and business hours.
- **`master_products`**: A centralized catalog of common grocery items.
- **`store_items`**: Store-specific inventory linked to master products or custom-created.
- **`orders`**: Tracks order status, customer, store, and payment details.
- **`order_items`**: Snapshots of items purchased at the time of order.
- **`otps`**: Stores transient OTPs for authentication and order verification.

### Relationships
- A `user` (role: store_owner) has exactly one `store`.
- A `store` has many `store_items`.
- An `order` belongs to one `customer` and one `store`.
- An `order` has many `order_items`.

---

## 🔌 API Route Mapping

### Authentication (`/auth`)
- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Request an OTP for login.
- `POST /auth/verify`: Verify OTP and receive JWT.

### Stores (`/stores`)
- `GET /stores`: List nearby stores (uses geospatial filtering).
- `GET /stores/:id`: Get detailed store information.
- `POST /stores`: Create a new store (Store Owner only).

### Items & Catalog (`/items`, `/catalog`)
- `GET /items/store/:storeId`: List all items available in a specific store.
- `GET /catalog`: Fetch the master product catalog.
- `POST /items`: Add/Update store-specific inventory.

### Orders (`/orders`)
- `POST /orders`: Place a new order (Customer).
- `GET /orders`: Fetch order history (Context-aware: customer see own, owner see store's).
- `GET /orders/:id`: Detailed order status.
- `PATCH /orders/:id/accept`: Store owner accepts an order (triggers OTP generation).
- `PATCH /orders/:id/status`: Update order lifecycle (preparing -> ready -> dispatched).
- `POST /orders/:id/verify-otp`: Finalize order via customer OTP (Pickup/Delivery).

---

## 📡 Real-time Updates (WebSockets)

The system uses Socket.io to keep clients in sync without manual refreshing.

### Key Events
- **`join_store(storeId)`**: Store Owners join their store's room to receive new orders.
- **`join_order(orderId)`**: Customers join their specific order room for status updates.
- **`order:new`**: Sent to store owners when a new order is placed.
- **`order:status_update`**: Sent to customers when their order progress (accepted, ready, etc.).
- **`order:accepted`**: Specific event for order acceptance, includes preparation time and OTP.

---

## 📦 Frontend Architecture

### State Management
- **Zustand**: Used for cart management (`cartStore.js`) and user session persistence.
- **GlobalStateProvider**: Context-based provider for app-wide settings.

### Screen Hierarchy (Customer App)
- `(tabs)/home`: Store discovery and categories.
- `(tabs)/orders`: Active and past orders.
- `store/[id]`: Product browsing within a store.
- `checkout`: Multi-step checkout process.
- `confirmation`: Order success screen.

### Screen Hierarchy (Store App)
- `(tabs)/index`: Dashboard with order summaries and stats.
- `(tabs)/orders`: Order queue management.
- `(tabs)/inventory`: Stock control and catalog management.

---

## 🔄 Core Workflows

### 1. The Order Lifecycle
1. **Discovery**: Customer browses nearby stores and adds items to the cart.
2. **Placement**: Customer places order (Socket event `order:new` triggered).
3. **Acceptance**: Store owner accepts, providing an estimated preparation time.
4. **Processing**: Store moves order to `preparing` then `ready`.
5. **Verification**: 
   - **Pickup**: Customer provides OTP at the store.
   - **Delivery**: Delivery partner (or store staff) verifies OTP at the customer's doorstep.
6. **Completion**: Order status moves to `collected` or `delivered`.

### 2. Inventory Management
- Store owners can pick items from the **Master Catalog** to quickly populate their store.
- Owners can also create **Custom Items** for unique products not in the master list.
- Stock is automatically reduced upon successful order completion.

---

## 🚀 Setup & Development

### Environment Variables
Required in `backend/.env`:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for token signing.
- `MOCK_DB`: Set to `true` for development without a live database.

### Running with Docker
```bash
docker-compose up -d
```

### Running Backend
```bash
cd backend
npm install
npm run dev
```

### Running Apps
```bash
cd customer-app # or store-app
npm install
npx expo start
```
