# KsauniBliss - Simple CI/CD Setup

## 🚀 Simple Deployment

This project uses a clean, simple CI/CD setup with just GitHub Actions and Docker.

### Files Structure:
```
├── .github/workflows/simple-deploy.yml  # GitHub Actions for auto-deploy
├── client/                              # React frontend
├── server/                              # Node.js backend  
├── docker-compose.yml                   # Simple Docker setup
└── README.md                           # This file
```

### How It Works:
1. **Push code** to GitHub main branch
2. **GitHub Actions** automatically:
   - Pulls code to your VPS
   - Builds Docker containers
   - Starts your application
3. **Live at** https://ksaunibliss.com

### Setup Requirements:
Add these secrets to GitHub repository settings:
```
HOST = your_vps_ip
USERNAME = root  
PASSWORD = your_vps_password
PORT = 22
```

### Manual Deployment:
```bash
# On your VPS:
cd /var/www/KsauniBlissFinal
git pull origin main
docker-compose up --build -d
```

### Check Status:
```bash
docker ps                    # See running containers
docker-compose logs -f       # View logs
curl http://localhost        # Test frontend
curl http://localhost:5000/api/health  # Test backend
```

That's it! Simple and clean. 🎉
