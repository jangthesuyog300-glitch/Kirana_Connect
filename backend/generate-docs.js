const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const outputPath = path.join(__dirname, '..', 'Tech_Stack_And_Deployment_Guide.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// ─── Helper functions ──────────────────────────────────────────────────────

function heading1(text) {
  doc.moveDown(0.5)
    .fontSize(22).fillColor('#1a1a2e').font('Helvetica-Bold').text(text)
    .moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#4f46e5').lineWidth(2).stroke();
  doc.moveDown(0.5);
}

function heading2(text) {
  doc.moveDown(0.5)
    .fontSize(15).fillColor('#4f46e5').font('Helvetica-Bold').text(text)
    .moveDown(0.2);
}

function heading3(text) {
  doc.fontSize(12).fillColor('#111').font('Helvetica-Bold').text(text).moveDown(0.1);
}

function body(text) {
  doc.fontSize(11).fillColor('#333').font('Helvetica').text(text, { lineGap: 3 }).moveDown(0.3);
}

function badge(text, color = '#4f46e5') {
  doc.fontSize(10).fillColor(color).font('Helvetica-Bold').text(`  ★ ${text}`, { indent: 10 });
}

function codeBlock(text) {
  const bgY = doc.y;
  doc.rect(50, bgY, 495, text.split('\n').length * 14 + 16).fill('#f4f4f8');
  doc.fontSize(9).fillColor('#1a1a2e').font('Courier').text(text, 60, bgY + 8, { lineGap: 3 });
  doc.moveDown(0.8);
}

function note(text) {
  const bgY = doc.y;
  const lines = Math.ceil(text.length / 85) + 1;
  doc.rect(50, bgY, 495, lines * 15 + 10).fill('#fffbeb');
  doc.fontSize(10).fillColor('#92400e').font('Helvetica').text(`⚠  ${text}`, 60, bgY + 7, { width: 475, lineGap: 2 });
  doc.moveDown(0.8);
}

function separator() {
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.moveDown(0.5);
}

// ─── COVER PAGE ────────────────────────────────────────────────────────────

doc.rect(0, 0, 595, 842).fill('#1a1a2e');
doc.fontSize(36).fillColor('#ffffff').font('Helvetica-Bold')
  .text('Kirana Connect', 50, 280, { align: 'center' });
doc.fontSize(18).fillColor('#a5b4fc').font('Helvetica')
  .text('Technology Stack & Render Deployment Guide', 50, 330, { align: 'center' });
doc.fontSize(11).fillColor('#6b7280')
  .text('Comprehensive Documentation for Developers', 50, 375, { align: 'center' });
doc.fontSize(10).fillColor('#4b5563')
  .text(`Generated: ${new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}`, 50, 780, { align: 'center' });

doc.addPage();

// ─── SECTION 1: TECHNOLOGY OVERVIEW ────────────────────────────────────────

heading1('1. Project Structure Overview');
body('Kirana Connect is a hyperlocal grocery marketplace with 3 main components:');
codeBlock(
`kirana-app/
├── backend/          → Node.js REST API + Socket.io (Real-time)
├── customer-app/     → React Native Expo (Customer mobile app)
└── store-app/        → React Native Expo (Store owner mobile app)`
);

// ─── SECTION 2: BACKEND ─────────────────────────────────────────────────────

heading1('2. Backend — Package Documentation');
body('The backend is a Node.js + Express REST API server that manages all business logic, database interactions, authentication, and real-time communication.');

separator();

heading2('2.1 Core Framework');
heading3('express  v4.18.2');
badge('Web Framework', '#059669');
body('What it does: Fast, minimalist web framework for Node.js. Handles HTTP routing, middleware, and request/response lifecycle.');
body('Why we need it: To define API endpoints like GET /stores, POST /auth/login, and structure the backend with middleware layers (auth, rate limiting, logging).');
codeBlock(
`const express = require('express');
const app = express();
app.get('/stores', async (req, res) => {
  const stores = await db.query('SELECT * FROM stores');
  res.json(stores.rows);
});
app.listen(process.env.PORT || 4000);`
);

heading3('cors  v2.8.5');
badge('Security / Middleware', '#dc2626');
body('Enables Cross-Origin Resource Sharing so the mobile apps (running on different ports/domains) can call the backend API securely.');
codeBlock(`app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(',') }));`);

heading3('helmet  v7.1.0');
badge('Security', '#dc2626');
body('Sets secure HTTP headers automatically to protect against common web vulnerabilities like XSS and clickjacking.');
codeBlock(`app.use(helmet());`);

heading3('morgan  v1.10.0');
badge('Logging', '#d97706');
body('HTTP request logger middleware. Logs every incoming request to the console for debugging and monitoring.');
codeBlock(`app.use(morgan('dev'));  // Output: GET /stores 200 12ms`);

heading3('express-rate-limit  v7.1.5');
badge('Security', '#dc2626');
body('Limits repeated requests to APIs to prevent abuse and DDoS attacks (e.g., max 100 requests per 15 minutes per IP).');

separator();

heading2('2.2 Database');
heading3('pg (node-postgres)  v8.11.3');
badge('Database Client', '#7c3aed');
body('What it does: Official PostgreSQL client for Node.js. Connects to the PostgreSQL database and executes SQL queries.');
body('Why we need it: All app data (users, stores, orders, products) is stored in PostgreSQL. The pg library is how the server reads and writes this data.');
codeBlock(
`const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);`
);

separator();

heading2('2.3 Real-time Communication');
heading3('socket.io  v4.7.2');
badge('Real-time / WebSockets', '#0891b2');
body('What it does: Enables bidirectional, event-based real-time communication between server and clients.');
body('Why we need it: When a customer places an order, the store owner needs to be instantly notified — without refreshing the screen. Socket.io pushes live updates for order status changes.');
codeBlock(
`// Server: emit when order is placed
io.to(\`store:\${storeId}\`).emit('new_order', orderData);

// Client (Store App): listen for new orders
socket.on('new_order', (order) => { showNotification(order); });`
);

separator();

heading2('2.4 Authentication & Security');
heading3('jsonwebtoken (JWT)  v9.0.2');
badge('Authentication', '#dc2626');
body('Generates and verifies JSON Web Tokens for stateless user authentication. After login, users receive a token they send with every API request.');
codeBlock(
`// Generate token on login
const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Verify token on protected routes
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  req.user = decoded;
});`
);

heading3('bcryptjs  v2.4.3');
badge('Password Security', '#dc2626');
body('Hashes passwords using the bcrypt algorithm. Passwords are never stored in plain text — only the hash is saved, making the app secure even if the database is exposed.');
codeBlock(
`// On registration
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// On login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);`
);

separator();

heading2('2.5 File Uploads & Image Management');
heading3('multer  v1.4.5');
badge('File Upload', '#d97706');
body('Middleware for handling multipart/form-data, used for uploading product images from the store owner app.');
codeBlock(`const upload = multer({ storage: multer.memoryStorage() });
app.post('/items/upload', upload.single('image'), handler);`);

heading3('cloudinary  v1.41.0');
badge('Cloud Storage', '#0891b2');
body('Cloud-based image storage. After multer captures the image, we upload it to Cloudinary and store the public URL in the database. This avoids storing images on the server disk.');
codeBlock(
`cloudinary.uploader.upload_stream({ folder: 'kirana-products' }, (err, result) => {
  const imageUrl = result.secure_url; // save this URL in PostgreSQL
});`
);

separator();

heading2('2.6 Validation & Utilities');
heading3('zod  v3.22.4');
badge('Validation', '#059669');
body('Schema-based validation for incoming API request data. Ensures all required fields exist and are of the correct type before processing.');
codeBlock(
`const orderSchema = z.object({
  storeId: z.string().uuid(),
  items: z.array(z.object({ itemId: z.string(), qty: z.number().min(1) }))
});
const validated = orderSchema.parse(req.body);`
);

heading3('dotenv  v16.3.1');
badge('Configuration', '#6b7280');
body('Loads environment variables from a .env file into process.env. This keeps secrets like DB passwords and API keys out of the code.');
codeBlock(`require('dotenv').config();
const dbUrl = process.env.DATABASE_URL;`);

heading3('uuid  v9.0.0');
badge('Utility', '#6b7280');
body('Generates universally unique IDs used for order IDs and other records where sequential integers are not suitable.');
codeBlock(`const { v4: uuidv4 } = require('uuid');
const orderId = uuidv4(); // e.g., '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'`);

heading3('pdfkit  v0.14.0');
badge('Report Generation', '#d97706');
body('Generates PDF reports (like invoices and sales summaries) programmatically. Used in the /reports route to produce downloadable PDFs for store owners.');

heading3('fast-csv  v4.3.6');
badge('Data Export', '#d97706');
body('Parses and generates CSV files. Used to export order data or inventory lists as downloadable spreadsheets.');

doc.addPage();

// ─── SECTION 3: FRONTEND ────────────────────────────────────────────────────

heading1('3. Frontend Apps — Package Documentation');
body('Both Customer App and Store App are built with React Native + Expo, sharing the same core packages but differing in features.');

separator();

heading2('3.1 Core Framework');
heading3('react  v19.1.0  +  react-native  v0.81.5');
badge('UI Framework', '#4f46e5');
body('React is the JavaScript library for building UI. React Native compiles React code into native Android and iOS components, providing true native performance.');

heading3('expo  ~54.0.33');
badge('Mobile Platform', '#4f46e5');
body('A framework on top of React Native that provides pre-built native modules, OTA updates, and a build system. Massively reduces the complexity of building mobile apps.');
codeBlock(`npx expo start          # Start dev server
npx expo start --android  # Open on Android emulator
npx expo start --web      # Open in browser`);

heading3('expo-router  ~6.0.23');
badge('Navigation / Routing', '#7c3aed');
body('File-based routing — any file created in the app/ folder automatically becomes a screen. No manual route configuration needed.');
codeBlock(
`app/
├── (tabs)/
│   ├── index.tsx      → "/" tab screen
│   ├── orders.tsx     → "/orders" tab screen
│   └── profile.tsx    → "/profile" tab screen
└── store/[id].tsx     → "/store/123" dynamic screen`
);

separator();

heading2('3.2 Maps & Location');
heading3('react-native-maps  v1.27.2  +  expo-location  ~19.0.8');
badge('Maps / GPS', '#059669');
body('expo-location gets the device\'s GPS coordinates. react-native-maps renders a fully interactive MapView with markers to show nearby stores.');
codeBlock(
`import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const { coords } = await Location.getCurrentPositionAsync({});
// coords.latitude, coords.longitude

<MapView initialRegion={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
  <Marker coordinate={{ latitude: 12.9716, longitude: 77.5946 }} title="Store Name" />
</MapView>`
);

separator();

heading2('3.3 Networking');
heading3('axios  v1.16.0');
badge('HTTP Client', '#0891b2');
body('Promise-based HTTP client used to make API calls to the backend. Supports interceptors for auto-attaching auth tokens to every request.');
codeBlock(
`import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000' });

// Auto-attach token to every request
api.interceptors.request.use(config => {
  config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

const stores = await api.get('/stores');`
);

heading3('socket.io-client  v4.8.3');
badge('Real-time / WebSockets', '#0891b2');
body('The client-side counterpart to the server\'s socket.io. Connects the app to the backend for real-time order updates.');
codeBlock(
`import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', { auth: { token: userToken } });
socket.emit('join_store', storeId);
socket.on('new_order', (order) => { alert('New order received!'); });`
);

separator();

heading2('3.4 State Management');
heading3('zustand  v5.0.12');
badge('Global State', '#7c3aed');
body('Lightweight state management. Replaces Redux for sharing global state (like cart items, user auth data) across all screens without complex boilerplate.');
codeBlock(
`import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  clearCart: () => set({ items: [] }),
}));

// In any screen:
const { items, addItem } = useCartStore();`
);

separator();

heading2('3.5 UI & Animations');
heading3('react-native-reanimated  ~4.1.1');
badge('Animations', '#d97706');
body('High-performance animations running on the native thread. Used for smooth transitions, swipe gestures, and micro-animations in the UI.');

heading3('react-native-gesture-handler  ~2.28.0');
badge('Gestures', '#d97706');
body('Handles touch gestures like swipe-to-delete, drag & drop, and pinch-to-zoom natively with proper performance.');

heading3('@expo/vector-icons  v15.0.3');
badge('Icons', '#6b7280');
body('Provides access to thousands of icons from popular sets like Ionicons, MaterialIcons, and FontAwesome.');
codeBlock(`import { Ionicons } from '@expo/vector-icons';
<Ionicons name="cart-outline" size={24} color="#4f46e5" />`);

doc.addPage();

// ─── SECTION 4: RENDER DEPLOYMENT ──────────────────────────────────────────

heading1('4. Render Deployment — Step by Step');

heading2('Step 1: Push Code to GitHub');
body('Render connects to GitHub to auto-deploy your code. If not already done:');
codeBlock(
`git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kirana-connect.git
git push -u origin main`
);
note('Make sure .env is in your .gitignore — never push secret keys to GitHub!');

heading2('Step 2: Create PostgreSQL on Render');
body('1. Go to https://render.com/dashboard\n2. Click "New +" → "PostgreSQL"\n3. Name: kirana-connect-db | Region: Singapore | Plan: Free\n4. Click "Create Database"\n5. Copy the "Internal Database URL" for Step 3.');

heading2('Step 3: Create Web Service on Render');
body('1. Go to https://render.com/dashboard\n2. Click "New +" → "Web Service"\n3. Connect GitHub → Select your repository');
codeBlock(
`Field              Value
──────────────────────────────────────
Name               kirana-connect-backend
Region             Singapore (same as DB)
Root Directory     backend
Runtime            Node
Build Command      npm install
Start Command      npm start
Plan               Free`
);

heading2('Step 4: Set Environment Variables on Render');
body('In the "Environment" tab of your Web Service, add these key-value pairs:');
codeBlock(
`Key                     Value
─────────────────────────────────────────────────────────
NODE_ENV                production
DATABASE_URL            (paste Internal DB URL from Step 2)
JWT_SECRET              kirana_super_secret_change_this_123
MOCK_DB                 false
CLOUDINARY_CLOUD_NAME   (from Cloudinary dashboard)
CLOUDINARY_API_KEY      (from Cloudinary dashboard)
CLOUDINARY_API_SECRET   (from Cloudinary dashboard)
ALLOWED_ORIGINS         *`
);
note('Setting MOCK_DB=false is critical — without it, data will not be saved to the real database.');

heading2('Step 5: Run Database Migrations');
body('After the service is live, set up the database tables by running from your local machine:');
codeBlock(
`# Windows PowerShell
$env:DATABASE_URL="your_render_db_url"
$env:NODE_ENV="production"
node src/db/migrate.js
node src/db/seed.js`
);

heading2('Step 6: Update Frontend API URLs');
body('After deployment, Render gives you a URL like https://kirana-connect-backend.onrender.com');
body('Find and update the API base URL in both apps:');
codeBlock(
`// customer-app/utils/api.js  &  store-app/utils/api.js
const API_URL = 'https://kirana-connect-backend.onrender.com';

// socket.js
const socket = io('https://kirana-connect-backend.onrender.com', { auth: { token } });`
);
note('Pro Tip: Use EXPO_PUBLIC_API_URL env variable in .env files to switch between dev and production easily.');

heading2('Step 7: Verify Deployment');
body('Test these endpoints to confirm the backend is running:');
codeBlock(
`GET  https://kirana-connect-backend.onrender.com/stores
POST https://kirana-connect-backend.onrender.com/auth/login
GET  https://kirana-connect-backend.onrender.com/catalog`
);

separator();

heading2('⚠️  Free Tier Limitations');
codeBlock(
`Issue            Explanation
──────────────────────────────────────────────────────────────────
Spin-down        Service sleeps after 15 min of inactivity.
                 First request takes ~30s to wake up.
DB Storage       Free PostgreSQL limit is 256MB.
No Persistent    Never store files locally on server disk.
Disk             Always use Cloudinary for images.`
);

heading2('🔄  Auto-Deploy (CI/CD)');
body('Once connected, every git push to your main branch automatically triggers a new Render deployment. No manual steps required!');
codeBlock(
`Deployment Flow:
git push → GitHub → Render detects change → npm install → npm start → Live!`
);

// ─── FOOTER ────────────────────────────────────────────────────────────────

doc.end();
console.log(`✅ PDF generated successfully at: ${outputPath}`);
