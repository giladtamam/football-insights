# Deployment Guide

## 🚀 Recommended: Railway + Vercel (FREE Tier)

Since AWS requires account verification for new accounts, here's the **fastest and free** alternative:

---

## Option 1: Railway (API) + Vercel (Frontend) - RECOMMENDED

### Step 1: Deploy API to Railway (Free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize and deploy
cd /path/to/myapp
railway init
railway up
```

Or deploy via GitHub:
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Add environment variables:
   - `DATABASE_URL`: `file:./prod.db`
   - `FOOTBALL_API_TOKEN`: your API key
5. Railway auto-deploys on every push!

### Step 2: Deploy Frontend to Vercel (Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd apps/web
vercel
```

Or connect via GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set root directory to `apps/web`
4. Add environment variable:
   - `VITE_GRAPHQL_URL`: Your Railway API URL

---

## Option 2: Fly.io (All-in-One, Free Tier)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (creates fly.toml)
fly launch

# Deploy
fly deploy
```

---

# AWS Setup (Requires Account Verification)

## 💰 Estimated Costs (Monthly)

| Service | First Year | After Free Tier |
|---------|------------|-----------------|
| EC2 t3.micro | **FREE** | ~$8.50 |
| S3 + CloudFront | ~$1-2 | ~$1-2 |
| RDS (optional) | **FREE** | ~$15 |
| **Total** | **~$1-2/month** | ~$25/month |

> 💡 **Tip**: Use SQLite instead of RDS to stay at ~$10/month after free tier!

---

## 🚀 Quick Start (5 Steps)

### Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create new user: `football-insights-deploy`
3. Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
4. Create Access Key → Save credentials

### Step 2: Install AWS CLI & Configure

```bash
# Install AWS CLI
brew install awscli  # macOS
# or: curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install

# Configure with your IAM credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (eu-west-1), Output format (json)
```

### Step 3: Run Setup Script

```bash
chmod +x scripts/aws-setup.sh
./scripts/aws-setup.sh
```

This creates:
- S3 bucket for frontend
- CloudFront CDN distribution
- EC2 instance for API
- Security groups

### Step 4: Configure EC2 Instance

```bash
# SSH into your EC2 instance (use the IP from setup output)
ssh -i ~/.ssh/football-insights-key.pem ec2-user@YOUR_EC2_IP

# Clone your repository
cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/myapp.git app
cd app

# Install dependencies
npm ci

# Create environment file
cat > apps/api/.env << EOF
DATABASE_URL="file:./prod.db"
FOOTBALL_API_TOKEN="your-api-football-token"
NODE_ENV="production"
EOF

# Initialize database
npm run db:push --workspace=packages/database

# Build and start API
npm run build --workspace=apps/api
pm2 start npm --name "football-api" -- run start --workspace=apps/api
pm2 save
```

### Step 5: Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets → Actions

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key |
| `EC2_HOST` | Your EC2 public IP |
| `EC2_SSH_KEY` | Contents of `~/.ssh/football-insights-key.pem` |
| `CLOUDFRONT_DISTRIBUTION_ID` | From setup output |
| `API_URL` | `http://YOUR_EC2_IP:4000/graphql` |

---

## 🔄 Deploy

After setup, every push to `main` will automatically:
1. Build frontend → Deploy to S3 → Invalidate CloudFront cache
2. SSH into EC2 → Pull changes → Restart API

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

---

## 🛠️ Manual Deployment Commands

### Frontend Only
```bash
# Build
npm run build --workspace=apps/web

# Deploy to S3
aws s3 sync apps/web/dist s3://football-insights-frontend --delete

# Invalidate CDN cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### API Only
```bash
# SSH to EC2
ssh -i ~/.ssh/football-insights-key.pem ec2-user@YOUR_EC2_IP

# Update and restart
cd /home/ec2-user/app
git pull
npm ci
npm run build --workspace=apps/api
pm2 restart football-api
```

---

## 🔒 HTTPS for API (Free with Let's Encrypt)

```bash
# On EC2 instance
sudo yum install -y certbot python3-certbot-nginx nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# Configure Nginx as reverse proxy
sudo cat > /etc/nginx/conf.d/api.conf << 'EOF'
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo systemctl restart nginx
```

---

## 📊 Even Cheaper Alternatives

### Option A: Railway.app (~$5/month)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Option B: Fly.io (Free tier available)
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### Option C: Vercel + Supabase (Free)
- Frontend: Vercel (free)
- API: Vercel Serverless Functions (free tier)
- Database: Supabase (free tier - 500MB)

---

## 🐛 Troubleshooting

### API not responding
```bash
ssh -i ~/.ssh/football-insights-key.pem ec2-user@YOUR_EC2_IP
pm2 logs football-api
pm2 restart football-api
```

### Frontend not updating
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Database issues
```bash
# Reset database
cd /home/ec2-user/app
rm packages/database/prisma/prod.db
npm run db:push --workspace=packages/database
```

