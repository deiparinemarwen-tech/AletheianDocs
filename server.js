const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://api.openweathermap.org"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.openweathermap.org", "wss:", "ws:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));

app.use(compression());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const db = require('./config/database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/weather', require('./routes/weather'));

// Socket.io for real-time chat
const chatNamespace = io.of('/chat');
chatNamespace.on('connection', (socket) => {
  console.log('User connected to chat:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    socket.emit('message', {
      user: 'System',
      message: 'Welcome to AletheianDocs support chat!',
      timestamp: new Date()
    });
  });
  
  socket.on('send-message', async (data) => {
    try {
      // Store message in database
      await db.query(
        'INSERT INTO chat_messages (user_id, username, message, room) VALUES ($1, $2, $3, $4)',
        [data.userId || null, data.username, data.message, data.room || 'general']
      );
      
      // Broadcast to room
      chatNamespace.to(data.room || 'general').emit('message', {
        user: data.username,
        message: data.message,
        timestamp: new Date(),
        userId: data.userId
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected from chat:', socket.id);
  });
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

// Initialize database tables and start server
async function startServer() {
  try {
    await db.initializeTables();
    server.listen(PORT, () => {
      console.log(`🚀 AletheianDocs server running on port ${PORT}`);
      console.log(`🌐 Visit: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };