# AletheianDocs - Vercel Deployment Guide

## 🚀 Deploy to Vercel with Railway Database

### Prerequisites
- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ Railway database already set up
- ✅ OpenWeather API key: `0eb62c55fecf8ba6269b46e8d04d67ba`
- ✅ Railway DATABASE_PUBLIC_URL: `postgresql://postgres:bfElHUFOeBPnOvaIyesVJlzQUXRMfrJM@caboose.proxy.rlwy.net:58151/railway`

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare Repository
1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - AletheianDocs"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Step 2: Deploy to Vercel
1. **Visit [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `./` (leave default)
   - Build Command: `npm install`
   - Output Directory: `./` (leave default)
   - Install Command: `npm install`

### Step 3: Set Environment Variables
In Vercel project settings, add these environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_PUBLIC_URL` | `postgresql://postgres:bfElHUFOeBPnOvaIyesVJlzQUXRMfrJM@caboose.proxy.rlwy.net:58151/railway` |
| `NEXT_OPENWEATHER_API_KEY` | `0eb62c55fecf8ba6269b46e8d04d67ba` |
| `JWT_SECRET` | `aletheiandocs_vercel_secret_2024_marwen` |
| `NODE_ENV` | `production` |

### Step 4: Deploy
- Click **"Deploy"**
- Wait for deployment to complete
- Your site will be available at `https://your-project-name.vercel.app`

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login and Deploy
```bash
# Login to Vercel
vercel login

# Deploy from project directory
cd /workspace
vercel

# Follow the prompts:
# ? Set up and deploy "~/workspace"? [Y/n] Y
# ? Which scope do you want to deploy to? [your-account]
# ? Link to existing project? [y/N] N
# ? What's your project's name? aletheiandocs
# ? In which directory is your code located? ./
```

### Step 3: Set Environment Variables
```bash
# Set environment variables
vercel env add DATABASE_PUBLIC_URL
# Enter: postgresql://postgres:bfElHUFOeBPnOvaIyesVJlzQUXRMfrJM@caboose.proxy.rlwy.net:58151/railway

vercel env add NEXT_OPENWEATHER_API_KEY
# Enter: 0eb62c55fecf8ba6269b46e8d04d67ba

vercel env add JWT_SECRET
# Enter: aletheiandocs_vercel_secret_2024_marwen

vercel env add NODE_ENV
# Enter: production
```

### Step 4: Redeploy with Environment Variables
```bash
vercel --prod
```

## Method 3: One-Click Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/aletheiandocs&env=DATABASE_PUBLIC_URL,NEXT_OPENWEATHER_API_KEY,JWT_SECRET&envDescription=Required%20environment%20variables&envLink=https://github.com/yourusername/aletheiandocs/blob/main/README.md)

## 🔧 Vercel-Specific Configuration

The project includes a `vercel.json` file with optimal settings:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/socket.io/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
```

## 🌐 Important Vercel Considerations

### WebSocket Support
Vercel supports WebSocket connections, but they work differently than traditional servers:
- Socket.io will automatically fall back to polling if needed
- Real-time chat will work but may have slightly higher latency

### File Uploads
For production use, consider using:
- **Vercel Blob** for file storage
- **Cloudinary** for image processing
- **AWS S3** for large file storage

Current setup stores files in memory/temporary storage which works for basic functionality.

### Function Timeout
- Maximum function duration is 30 seconds (configured in vercel.json)
- Most operations will complete well within this limit

## 🔍 Post-Deployment Verification

### 1. Check Application Health
```bash
curl https://your-app.vercel.app/
# Should return the main HTML page
```

### 2. Test Database Connection
- Navigate to `https://your-app.vercel.app/admin`
- Login with admin/admin123
- Check if dashboard loads with statistics

### 3. Verify Core Features
- [ ] User registration/login works
- [ ] Document browsing loads
- [ ] Weather tool connects to API
- [ ] Philippines map displays
- [ ] Forum categories show
- [ ] Real-time chat connects (may fall back to polling)

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test database connection from your local machine
psql postgresql://postgres:bfElHUFOeBPnOvaIyesVJlzQUXRMfrJM@caboose.proxy.rlwy.net:58151/railway -c "SELECT 1;"
```

### Environment Variables Not Working
1. Check Vercel dashboard → Project → Settings → Environment Variables
2. Ensure all variables are set for "Production" environment
3. Redeploy after adding variables: `vercel --prod`

### WebSocket/Chat Issues
- Chat will work but may use polling instead of WebSocket
- This is normal on Vercel and provides the same functionality

### Build Failures
Check Vercel function logs:
1. Go to Vercel dashboard
2. Select your project
3. Go to "Functions" tab
4. Check logs for errors

## 📈 Optimization Tips

### 1. Custom Domain
- Add your custom domain in Vercel dashboard
- Configure DNS settings as instructed

### 2. Performance Monitoring
- Enable Vercel Analytics
- Monitor function execution times
- Check error rates

### 3. Security Headers
```javascript
// Already configured in server.js with Helmet.js
```

## 🔄 Updates and Maintenance

### Automatic Deployments
- Connect GitHub repository to Vercel
- Every push to main branch triggers deployment
- Preview deployments for pull requests

### Manual Deployments
```bash
# Deploy latest changes
vercel --prod

# Deploy specific branch
vercel --prod --branch feature-branch
```

## 📊 Expected Performance

### Cold Start
- First request may take 2-3 seconds (function cold start)
- Subsequent requests are fast (< 500ms)

### Concurrent Users
- Vercel handles scaling automatically
- Database connections are managed efficiently

### Storage Limits
- Function memory: 1024MB
- Execution time: 30 seconds
- No persistent file storage (use external services for files)

## 🎯 Production Recommendations

### 1. File Storage
For production file uploads, add external storage:

```javascript
// Example: Vercel Blob integration
import { put } from '@vercel/blob';

async function uploadToBlob(file) {
  const blob = await put(file.originalname, file.buffer, {
    access: 'public',
  });
  return blob.url;
}
```

### 2. Database Connection Pooling
Already optimized in the current setup with efficient connection management.

### 3. Error Monitoring
Consider adding:
- Sentry for error tracking
- Vercel Analytics for performance monitoring

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set:
  - [ ] `DATABASE_PUBLIC_URL`
  - [ ] `NEXT_OPENWEATHER_API_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV`
- [ ] Application deployed successfully
- [ ] Database connection verified
- [ ] Admin panel accessible
- [ ] All core features tested

## 🆘 Support

If you encounter issues:

1. **Check Vercel function logs** in dashboard
2. **Verify environment variables** are set correctly
3. **Test database connection** manually
4. **Check Railway database** is accessible
5. **Review Vercel documentation** for Node.js apps

---

**Your AletheianDocs is ready for Vercel! 🚀**

Access your deployed application at: `https://your-project-name.vercel.app`

Default admin login:
- Username: `admin`
- Password: `admin123`

*Created by Marwen Deiparine*