# AletheianDocs

**Your Trusted Philippine Document Center**

A modern, professional Filipino website that provides easy access to government forms and documents, built with Node.js, Express, PostgreSQL, and features Filipino-inspired design elements.

## ✨ Features

### 🏛️ Document Center
- **Comprehensive Library**: Downloadable and printable Philippine government forms
- **Smart Organization**: Categories with search and filter functionality  
- **One-Click Access**: PDF download with print-ready formatting
- **Template Generation**: Auto-generated templates for forms without files

### 🛠️ Built-in Tools
- **Interactive Philippines Map**: Leaflet-powered map with city markers
- **Live Weather System**: Real-time weather data for Philippine cities using OpenWeather API
- **Location-Based Weather**: Click anywhere on the map for weather information

### 👥 User Interaction
- **Real-time Chat**: Socket.io-powered support chatbox
- **Community Forum**: Full-featured forum with categories, posts, and replies
- **User Authentication**: Secure registration and login system

### ⚙️ Admin Panel
- **Document Management**: Upload, edit, and organize documents
- **User Administration**: Manage users and permissions
- **Forum Moderation**: Pin, lock, and moderate forum content
- **Chat Moderation**: Monitor and moderate chat messages
- **Announcements**: Create and manage site announcements

### 🎨 Design & Experience
- **Filipino-Inspired UI**: Tropical colors and cultural design elements
- **Mobile-First**: Fully responsive design for all devices
- **Modern Interface**: Clean, professional layout with smooth animations
- **Accessibility**: WCAG-compliant with keyboard navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL database
- OpenWeather API key

### Local Development

1. **Clone and Install**
```bash
git clone <repository-url>
cd aletheiandocs
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# The app will automatically create tables on first run
# Just ensure your PostgreSQL database is running
```

4. **Start Development Server**
```bash
npm run dev
# or
npm start
```

5. **Access Application**
```
http://localhost:3000
```

### Default Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@aletheiandocs.com`

## 🌐 Railway Deployment

### Automatic Deployment

1. **Fork/Clone** this repository
2. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select this project

3. **Environment Variables**:
   Railway will automatically detect the Node.js app. Set these environment variables:
   ```
   DATABASE_PUBLIC_URL=your_postgresql_connection_string
   NEXT_OPENWEATHER_API_KEY=your_openweather_api_key
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   ```

4. **Deploy**: Railway will automatically build and deploy your application

### Manual Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add postgresql

# Set environment variables
railway variables set NEXT_OPENWEATHER_API_KEY=your_api_key
railway variables set JWT_SECRET=your_secret_key

# Deploy
railway up
```

## 📁 Project Structure

```
aletheiandocs/
├── config/
│   └── database.js          # Database configuration and schema
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── documents.js        # Document management APIs
│   ├── forum.js            # Forum functionality
│   ├── admin.js            # Admin panel APIs
│   └── weather.js          # Weather API integration
├── public/
│   ├── css/
│   │   ├── main.css        # Core styles with Filipino theme
│   │   ├── components.css  # Component-specific styles
│   │   └── responsive.css  # Mobile responsiveness
│   ├── js/
│   │   ├── api.js          # API client
│   │   ├── auth.js         # Authentication logic
│   │   ├── documents.js    # Document management
│   │   ├── forum.js        # Forum functionality
│   │   ├── tools.js        # Map and weather tools
│   │   ├── chat.js         # Real-time chat
│   │   ├── admin.js        # Admin panel
│   │   └── main.js         # Main application controller
│   └── index.html          # Single-page application
├── uploads/                # Document file storage
├── server.js              # Express server setup
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PUBLIC_URL` | PostgreSQL connection string | ✅ |
| `NEXT_OPENWEATHER_API_KEY` | OpenWeather API key for weather | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |

### Database Schema

The application automatically creates these tables:
- `users` - User accounts and authentication
- `documents` - Document metadata and files
- `forum_categories` - Forum category organization
- `forum_posts` - Forum posts and discussions
- `forum_replies` - Replies to forum posts
- `chat_messages` - Chat message history
- `announcements` - Site announcements

## 🎨 Filipino Design Elements

### Color Palette
- **Primary Blue**: `#4F46E5` (Philippine flag inspired)
- **Tropical Teal**: `#0D9488` (Ocean and islands)
- **Sunset Orange**: `#F97316` (Tropical sunsets)
- **Island Green**: `#059669` (Lush landscapes)
- **Coral Pink**: `#EC4899` (Marine life)

### Cultural Features
- Baybayin-inspired patterns in backgrounds
- Jeepney-inspired accent colors
- Tropical tone gradients
- Island-themed iconography

## 📱 Mobile Features

- **Touch-Optimized**: All interactive elements sized for mobile
- **Swipe Navigation**: Smooth mobile navigation
- **Responsive Images**: Optimized for various screen sizes
- **Offline Support**: Basic offline functionality (future enhancement)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Sanitization**: XSS protection on all user inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: API rate limiting to prevent abuse
- **SQL Injection Prevention**: Parameterized queries
- **Helmet.js**: Security headers and protection

## 🚀 Performance

- **Compression**: Gzip compression enabled
- **Caching**: Static asset caching
- **Database Optimization**: Indexed queries and efficient schemas
- **Lazy Loading**: Images and components loaded on demand
- **Minification**: CSS and JS optimization for production

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Check for security vulnerabilities
npm audit
```

## 📈 Monitoring

The admin panel provides insights into:
- User registration trends
- Document download statistics
- Forum activity metrics
- Chat usage patterns

## 🔄 Updates and Maintenance

### Adding New Documents
1. Login as admin
2. Navigate to Admin Panel > Documents
3. Click "Upload New Document"
4. Fill in details and upload file (optional)

### Managing Users
1. Admin Panel > Users
2. View all registered users
3. Promote/demote admin status
4. Remove problematic users

### Forum Moderation
1. Pin important posts
2. Lock discussions when needed
3. Delete inappropriate content
4. Monitor user activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Created By

**Marwen Deiparine**

---

## 🚀 Deploy Now

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YUxgRo)

Click the button above to deploy AletheianDocs to Railway with one click!

---

*AletheianDocs - Empowering Filipino citizens with easy access to government documents and forms.*