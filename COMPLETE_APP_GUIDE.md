# 📘 Kirana Connect — Complete Application Manual

This document serves as the master guide for the **Kirana Connect** platform. It details every core process and user interface for Customers, Store Owners (Admin), and Workers.

---

## 📄 Page 1: Authentication & Onboarding
*The gateway to hyperlocal shopping.*

Every user (Customer, Owner, or Worker) starts their journey with a secure, OTP-based authentication system.

![Auth Flow](file:///C:/Users/VICTUS/.gemini/antigravity/brain/17932138-cff3-4e51-bbcd-90f26a156917/auth_otp_flow_1778067286284.png)

### Processes:
1.  **Registration**: New users provide their name, phone number, and role.
2.  **Login**: Users enter their registered phone number.
3.  **Verification**: A 4-digit OTP is sent (simulated as `1234` for development).
4.  **Role Selection**: The app automatically routes users to the correct interface based on their account type.

---

## 📄 Page 2: Customer - Discovery & Shopping
*Finding the best local groceries.*

Customers can browse stores in their vicinity using geospatial data, ensuring fast delivery and fresh products.

![Customer Home](file:///C:/Users/VICTUS/.gemini/antigravity/brain/17932138-cff3-4e51-bbcd-90f26a156917/customer_app_home_1778066758446.png)

### Processes:
1.  **Store Search**: Stores are filtered by distance (radius search).
2.  **Category Browsing**: Quick filters for snacks, dairy, staples, etc.
3.  **Product Selection**: Add items to a store-specific cart.
4.  **Cart Enforcement**: The app prevents mixing items from multiple stores to maintain delivery efficiency.

---

## 📄 Page 3: Customer - Checkout & Tracking
*Seamless ordering and real-time updates.*

Once the cart is ready, the checkout process handles payment and triggers the store's workflow.

![Checkout Confirmation](file:///C:/Users/VICTUS/.gemini/antigravity/brain/17932138-cff3-4e51-bbcd-90f26a156917/checkout_confirmation_1778067510395.png)

### Processes:
1.  **Checkout**: Review items, select delivery or pickup, and set the address.
2.  **Payment**: Integration with payment gateways (simulated pending/paid status).
3.  **Confirmation**: A success screen displays the Order ID and a Pickup OTP.
4.  **Order Tracking**: A live status bar updates as the store accepts and prepares the order.

---

## 📄 Page 4: Admin - Store & Staff Management
*The command center for store owners.*

Store owners (Admins) manage the high-level operations of their digital shop.

![Admin Dashboard](file:///C:/Users/VICTUS/.gemini/antigravity/brain/17932138-cff3-4e51-bbcd-90f26a156917/store_admin_dashboard_1778066890467.png)

### Processes:
1.  **Dashboard Monitoring**: Real-time sales charts and pending order counts.
2.  **Staff Management**: Add workers by phone number and name. Monitor their availability.
3.  **Store Settings**: Update business hours, delivery radius, and minimum order amounts.
4.  **Financials**: Review commission deductions and net payouts for every transaction.

---

## 📄 Page 5: Admin - Inventory & Catalog
*Keeping the shelves stocked digitally.*

Managing thousands of items is made easy through the Master Catalog system.

![Inventory Management](file:///C:/Users/VICTUS/.gemini/antigravity/brain/17932138-cff3-4e51-bbcd-90f26a156917/admin_inventory_catalog_1778067525033.png)

### Processes:
1.  **Master Catalog Sync**: Choose items from a pre-defined list (e.g., Amul Milk, Parle-G) to save time.
2.  **Custom Item Creation**: Add unique local products with custom images and descriptions.
3.  **Stock Control**: Update quantities and set 'Low Stock' alerts.
4.  **Pricing**: Manage weight-based vs. unit-based pricing models.

---

## 📄 Page 6: Worker - Order Fulfillment
*Speed and accuracy on the ground.*

Workers focus on one task: getting orders ready for the customer.

![Worker Flow](file:///C:/Users/VICTUS/.gemini/antigravity/brain/17932138-cff3-4e51-bbcd-90f26a156917/worker_order_view_1778066906247.png)

### Processes:
1.  **Order Acceptance**: Workers claim 'Placed' orders.
2.  **Preparation**: Items are picked and packed. The status is moved to 'Preparing'.
3.  **Ready Notification**: Once packed, the worker marks it 'Ready', notifying the customer via WebSocket.
4.  **Verification**: 
    - For **Pickup**: The worker verifies the customer's OTP.
    - For **Delivery**: The delivery partner verifies the OTP at the doorstep.

---

## 🖨️ How to Generate the PDF
1.  Open this file in a Markdown-capable editor.
2.  Press `Ctrl+P` (Windows) or `Cmd+P` (Mac).
3.  Select **Save as PDF**.
4.  The images and page breaks will be preserved in the final document.

*Built for Kirana Connect — Empowering Local Commerce.*
