require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Route imports
const authRoutes = require('./routes/auth');
const storesRoutes = require('./routes/stores');
const itemsRoutes = require('./routes/items');
const ordersRoutes = require('./routes/orders');
const reportsRoutes = require('./routes/reports');
const paymentsRoutes = require('./routes/payments');
const catalogRoutes = require('./routes/catalog');
const adminRoutes = require('./routes/admin');
const workerRoutes = require('./routes/worker');

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.userId);
  
  socket.on('join_store', (storeId) => {
    socket.join(`store:${storeId}`);
    console.log(`User ${socket.user.userId} joined store:${storeId}`);
  });
  
  socket.on('join_order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`User ${socket.user.userId} joined order:${orderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.userId);
  });
});

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));

// Inject IO into request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/stores', storesRoutes);
app.use('/items', itemsRoutes);
app.use('/orders', ordersRoutes);
app.use('/api/owner/orders', ordersRoutes);
app.use('/admin', adminRoutes);
app.use('/worker', workerRoutes);
app.use('/reports', reportsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/catalog', catalogRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Kirana Connect Backend running on port ${PORT}`);
});
