# Simple CI/CD Deployment Guide

## 🚀 Quick Setup

### 1. GitHub Secrets Setup
Go to: https://github.com/mayurimulay789/KsauniBlissFinal/settings/secrets/actions

Add these 4 secrets:
```
HOST = 31.97.227.75
USERNAME = root
PASSWORD = your_vps_password
PORT = 22
```

### 2. Your VPS is Ready
- Location: `/var/www/KsauniBlissFinal`
- Docker: ✅ Installed
- Files: ✅ Latest code pulled

### 3. How It Works
1. **Push code** to GitHub main branch
2. **GitHub Actions** automatically:
   - SSH into your VPS
   - Pull latest code
   - Build Docker containers
   - Deploy your site

### 4. Test Deployment
Make any small change and push:
```bash
git add .
git commit -m "Test deployment"
git push origin main
```

### 5. Check Deployment Status
- **GitHub Actions**: https://github.com/mayurimulay789/KsauniBlissFinal/actions
- **Your Website**: https://ksaunibliss.com
- **Server Health**: https://ksaunibliss.com/api/health

## 🎯 Fixed Issues
- ✅ **AdminSlice**: Fixed missing adminAPI
- ✅ **Docker Build**: Builds inside container (no pre-build needed)
- ✅ **Simple Workflow**: No webhooks, just GitHub Actions
- ✅ **Auto Deploy**: Every push triggers deployment

## 📱 Next Push = Live Update
Your website will automatically update within 2-3 minutes of pushing code! 🚀
