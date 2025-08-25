# AletheianDocs Deployment Guide

## 🚀 Railway Deployment (Recommended)

Railway provides the easiest way to deploy AletheianDocs with PostgreSQL database included.

### Method 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YUxgRo)

1. Click the deploy button above
2. Sign in to Railway (GitHub account recommended)
3. Fork the repository when prompted
4. Set environment variables:
   - `NEXT_OPENWEATHER_API_KEY`: Your OpenWeather API key
   - `JWT_SECRET`: A secure random string for JWT signing
5. Deploy and wait for build completion

### Method 2: Manual Railway Setup

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Clone repository
git clone <your-repo-url>
cd aletheiandocs

# 3. Login to Railway
railway login

# 4. Initialize new Railway project
railway init

# 5. Add PostgreSQL database
railway add postgresql

# 6. Set environment variables
railway variables set NEXT_OPENWEATHER_API_KEY=your_openweather_api_key
railway variables set JWT_SECRET=your_secure_jwt_secret
railway variables set NODE_ENV=production

# 7. Deploy
railway up
```

### Method 3: GitHub Integration

1. **Fork Repository**: Fork this repository to your GitHub account

2. **Create Railway Project**:
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Add Database**:
   - In your Railway project dashboard
   - Click "Add Service" → "Database" → "PostgreSQL"

4. **Configure Environment Variables**:
   ```
   DATABASE_PUBLIC_URL=postgresql://postgres:password@host:port/database
   NEXT_OPENWEATHER_API_KEY=your_openweather_api_key  
   JWT_SECRET=your_secure_jwt_secret
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy**: Railway will automatically deploy on every push to main branch

## 🌐 Alternative Deployment Options

### Heroku

```bash
# 1. Install Heroku CLI and login
heroku login

# 2. Create Heroku app
heroku create your-app-name

# 3. Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# 4. Set environment variables
heroku config:set NEXT_OPENWEATHER_API_KEY=your_api_key
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set NODE_ENV=production

# 5. Deploy
git push heroku main
```

### DigitalOcean App Platform

1. Create new app in DigitalOcean App Platform
2. Connect to your GitHub repository
3. Configure build settings:
   - Build command: `npm install`
   - Run command: `npm start`
4. Add managed PostgreSQL database
5. Set environment variables in app settings

### Vercel + PlanetScale

1. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```

2. **Setup PlanetScale Database**:
   - Create account at PlanetScale
   - Create new database
   - Get connection string

3. **Configure Environment Variables** in Vercel dashboard

### Self-Hosted (VPS/Server)

```bash
# 1. Server setup (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm postgresql nginx

# 2. Clone repository
git clone <your-repo-url>
cd aletheiandocs

# 3. Install dependencies
npm install

# 4. Setup PostgreSQL
sudo -u postgres createdb aletheiandocs
sudo -u postgres createuser aletheiandocs_user

# 5. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 6. Start with PM2
npm install -g pm2
pm2 start server.js --name aletheiandocs
pm2 startup
pm2 save

# 7. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/aletheiandocs
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_PUBLIC_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@host:5432/db` |
| `NEXT_OPENWEATHER_API_KEY` | OpenWeather API key | ✅ | `0eb62c55fecf8ba6269b46e8d04d67ba` |
| `JWT_SECRET` | JWT signing secret | ✅ | `your-super-secret-jwt-key-here` |
| `NODE_ENV` | Environment mode | ✅ | `production` |
| `PORT` | Server port | ❌ | `3000` |

## 📋 Pre-Deployment Checklist

- [ ] ✅ OpenWeather API key obtained
- [ ] ✅ Database URL configured
- [ ] ✅ JWT secret set (use strong random string)
- [ ] ✅ Environment variables set
- [ ] ✅ Repository cloned/forked
- [ ] ✅ Dependencies installable (`npm install` works)
- [ ] ✅ App starts locally (`npm start` works)

## 🔍 Post-Deployment Verification

1. **Check Application Health**:
   ```bash
   curl https://your-app.railway.app/
   # Should return the main HTML page
   ```

2. **Verify Database Connection**:
   - Navigate to `/admin` (login as admin)
   - Check dashboard statistics
   - Create a test user

3. **Test Core Features**:
   - [ ] User registration/login
   - [ ] Document browsing
   - [ ] Weather tool functionality
   - [ ] Philippines map loading
   - [ ] Forum category display
   - [ ] Real-time chat connection

4. **Check Admin Functions**:
   - [ ] Admin panel accessible
   - [ ] Document upload works
   - [ ] User management functions
   - [ ] Announcements system

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check if DATABASE_PUBLIC_URL is set correctly
echo $DATABASE_PUBLIC_URL

# Verify database accessibility
psql $DATABASE_PUBLIC_URL -c "SELECT 1;"
```

**Weather API Not Working**:
- Verify OpenWeather API key is valid
- Check API key has sufficient quota
- Test API key manually:
  ```bash
  curl "https://api.openweathermap.org/data/2.5/weather?q=Manila&appid=YOUR_API_KEY"
  ```

**Socket.io Connection Issues**:
- Ensure WebSocket support is enabled on hosting platform
- Check for proxy/firewall blocking WebSocket connections
- Verify CORS settings for your domain

**File Upload Issues**:
- Ensure `uploads/` directory exists and is writable
- Check file size limits on hosting platform
- Verify multer configuration matches hosting requirements

### Railway-Specific Troubleshooting

**Build Failures**:
```bash
# Check Railway logs
railway logs

# Redeploy with verbose logging
railway up --detach=false
```

**Database Connection**:
```bash
# Check database variables
railway variables

# Connect to database directly
railway connect postgres
```

**Environment Variables**:
```bash
# List all variables
railway variables

# Set missing variables
railway variables set KEY=value
```

## 📈 Performance Optimization

### Production Optimizations

1. **Enable Compression** (already configured)
2. **Database Indexing** (automatically applied)
3. **Static Asset Caching** (configured)
4. **Rate Limiting** (enabled)

### Monitoring

- Use Railway's built-in metrics
- Monitor database performance
- Set up uptime monitoring (UptimeRobot, etc.)
- Enable error tracking (Sentry, etc.)

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# For Railway GitHub integration
git push origin main
# Railway auto-deploys on push

# For manual Railway deployment
railway up

# For Heroku
git push heroku main
```

### Database Maintenance

- Regular backups (automated on Railway/Heroku)
- Monitor database size and performance
- Clean up old chat messages periodically
- Archive old forum posts if needed

### Security Updates

- Keep dependencies updated: `npm audit && npm update`
- Rotate JWT secrets periodically
- Monitor access logs for suspicious activity
- Update API keys if compromised

---

## 🆘 Support

If you encounter issues during deployment:

1. Check the [troubleshooting section](#-troubleshooting) above
2. Review Railway/hosting platform documentation
3. Check application logs for error messages
4. Verify all environment variables are set correctly

---

**Happy Deploying! 🚀**

*Created by Marwen Deiparine*