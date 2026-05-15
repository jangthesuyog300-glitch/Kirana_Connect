# Kirana Connect - Technology Stack & Package Documentation

This document explains the key technologies and packages used across the Kirana Connect platform (Backend, Customer App, and Store App), why they are needed, and how they are used.

---

## 1. Backend API (Node.js & Express)

The backend serves as the central brain of the application, handling business logic, database connections, and real-time communication.

### **express**
*   **What it is:** A fast, minimalist web framework for Node.js.
*   **Need:** We need it to easily create API routes (endpoints), handle HTTP requests (GET, POST, etc.), and manage middleware for things like authentication and error handling.
*   **How to use:** 
    ```javascript
    const express = require('express');
    const app = express();
    app.get('/api/stores', (req, res) => { res.json(stores); });
    app.listen(3000);
    ```

### **pg (node-postgres)**
*   **What it is:** A PostgreSQL client for Node.js.
*   **Need:** To connect to the PostgreSQL database, run SQL queries, and securely insert/retrieve data like users, orders, and products.
*   **How to use:**
    ```javascript
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT * FROM users');
    ```

### **socket.io**
*   **What it is:** A library for real-time, bidirectional, event-based communication.
*   **Need:** To instantly notify the Store App when a Customer places an order, and to notify the Customer when their order status changes (e.g., "Accepted", "Ready").
*   **How to use:**
    ```javascript
    const { Server } = require('socket.io');
    const io = new Server(httpServer);
    io.on('connection', (socket) => { 
        socket.emit('orderUpdate', { status: 'Ready' }); 
    });
    ```

### **jsonwebtoken (JWT)**
*   **What it is:** An implementation of JSON Web Tokens.
*   **Need:** To securely authenticate users and verify their identity across API requests without maintaining session state on the server.
*   **How to use:**
    ```javascript
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 123 }, 'secretKey', { expiresIn: '1h' });
    ```

### **bcryptjs**
*   **What it is:** A library to hash passwords.
*   **Need:** For security. We must never store plain-text passwords in the database. Bcrypt hashes the password, making it impossible to read even if the database is compromised.
*   **How to use:**
    ```javascript
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('myPassword123', 10);
    ```

### **multer & cloudinary**
*   **What it is:** Multer handles file uploads, Cloudinary handles cloud storage.
*   **Need:** To allow store owners to upload images for their custom products.
*   **How to use:** Multer catches the file in the request, and we pass that file buffer to Cloudinary's SDK to get a public URL for the image.

---

## 2. Frontend Applications (Customer & Store Apps)

Both frontend applications are built using React Native and Expo, allowing them to run on Android, iOS, and the Web from a single codebase.

### **expo**
*   **What it is:** A framework and platform for universal React applications.
*   **Need:** It provides a vast suite of pre-built tools and native APIs (camera, location, file system) so we don't have to write complex native code (Java/Swift).
*   **How to use:** Run `npx expo start` to launch the development server and scan the QR code using the Expo Go mobile app.

### **expo-router**
*   **What it is:** A file-based router for Expo.
*   **Need:** To manage screen navigation. Instead of manually configuring complex navigators, we just create files in the `app/` folder, and they automatically become screens.
*   **How to use:** Create a file `app/profile.tsx` to automatically create a route accessible at `/profile`.

### **react-native-maps & expo-location**
*   **What it is:** Libraries for map interfaces and fetching GPS coordinates.
*   **Need:** Crucial for the hyperlocal aspect of the app. `expo-location` gets the user's current GPS coordinates, and `react-native-maps` plots nearby stores on a visual map interface.
*   **How to use:**
    ```tsx
    import MapView, { Marker } from 'react-native-maps';
    <MapView initialRegion={...}>
       <Marker coordinate={{ latitude: 12.9, longitude: 77.5 }} />
    </MapView>
    ```

### **axios**
*   **What it is:** A promise-based HTTP client.
*   **Need:** To fetch data from our Node.js backend API (e.g., fetching the product catalog or sending a login request).
*   **How to use:**
    ```javascript
    import axios from 'axios';
    const response = await axios.get('http://backend-url/api/products');
    ```

### **zustand**
*   **What it is:** A small, fast, and scalable state-management library.
*   **Need:** To share data across different screens without "prop drilling". For example, managing the user's shopping cart items or their authentication token globally.
*   **How to use:**
    ```javascript
    import { create } from 'zustand';
    const useStore = create((set) => ({
      cart: [],
      addToCart: (item) => set((state) => ({ cart: [...state.cart, item] }))
    }));
    ```
