#!/bin/bash

# AWS Setup Script for Football Insights
# Run this once to set up your AWS infrastructure

set -e

# Configuration - CHANGE THESE VALUES
AWS_REGION="eu-west-1"
APP_NAME="football-insights"
DOMAIN_NAME="" # Optional: your domain name

echo "🚀 Setting up AWS infrastructure for $APP_NAME"

# Create S3 bucket for frontend
echo "📦 Creating S3 bucket..."
aws s3 mb s3://${APP_NAME}-frontend --region $AWS_REGION 2>/dev/null || echo "Bucket already exists"

# Enable static website hosting
aws s3 website s3://${APP_NAME}-frontend \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public access
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${APP_NAME}-frontend/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket ${APP_NAME}-frontend \
  --policy file:///tmp/bucket-policy.json

# Create CloudFront distribution
echo "🌐 Creating CloudFront distribution..."
ORIGIN_DOMAIN="${APP_NAME}-frontend.s3-website-${AWS_REGION}.amazonaws.com"

cat > /tmp/cf-config.json << EOF
{
  "CallerReference": "${APP_NAME}-$(date +%s)",
  "Comment": "${APP_NAME} frontend",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${APP_NAME}-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "CachedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${APP_NAME}-frontend",
        "DomainName": "${ORIGIN_DOMAIN}",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

aws cloudfront create-distribution \
  --distribution-config file:///tmp/cf-config.json \
  > /tmp/cf-output.json

DISTRIBUTION_ID=$(cat /tmp/cf-output.json | grep -o '"Id": "[^"]*"' | head -1 | cut -d'"' -f4)
CLOUDFRONT_DOMAIN=$(cat /tmp/cf-output.json | grep -o '"DomainName": "[^"]*"' | head -1 | cut -d'"' -f4)

echo "✅ CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "✅ CloudFront Domain: $CLOUDFRONT_DOMAIN"

# Create EC2 key pair
echo "🔑 Creating EC2 key pair..."
aws ec2 create-key-pair \
  --key-name ${APP_NAME}-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/${APP_NAME}-key.pem 2>/dev/null || echo "Key pair already exists"

chmod 400 ~/.ssh/${APP_NAME}-key.pem 2>/dev/null || true

# Create security group
echo "🔒 Creating security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name ${APP_NAME}-sg \
  --description "Security group for ${APP_NAME}" \
  --query 'GroupId' \
  --output text 2>/dev/null) || SG_ID=$(aws ec2 describe-security-groups \
    --group-names ${APP_NAME}-sg \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow SSH, HTTP, HTTPS, and API port
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 4000 --cidr 0.0.0.0/0 2>/dev/null || true

echo "✅ Security Group ID: $SG_ID"

# Launch EC2 instance (Amazon Linux 2023, t3.micro - free tier)
echo "🖥️  Launching EC2 instance..."

# Get latest Amazon Linux 2023 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-*-x86_64" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

# User data script for initial setup
cat > /tmp/user-data.sh << 'USERDATA'
#!/bin/bash
yum update -y
yum install -y git nodejs npm

# Install PM2 globally
npm install -g pm2

# Create app directory
mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app

# Install SQLite (for development/small scale)
yum install -y sqlite

# Set up PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
USERDATA

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name ${APP_NAME}-key \
  --security-group-ids $SG_ID \
  --user-data file:///tmp/user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${APP_NAME}-api}]" \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

EC2_PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo ""
echo "=============================================="
echo "✅ AWS Infrastructure Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Save these values in GitHub Secrets:"
echo ""
echo "AWS_ACCESS_KEY_ID:        (your IAM access key)"
echo "AWS_SECRET_ACCESS_KEY:    (your IAM secret key)"
echo "EC2_HOST:                 $EC2_PUBLIC_IP"
echo "EC2_SSH_KEY:              (contents of ~/.ssh/${APP_NAME}-key.pem)"
echo "CLOUDFRONT_DISTRIBUTION_ID: $DISTRIBUTION_ID"
echo "API_URL:                  http://$EC2_PUBLIC_IP:4000/graphql"
echo ""
echo "🌐 Your app will be available at:"
echo "   Frontend: https://$CLOUDFRONT_DOMAIN"
echo "   API:      http://$EC2_PUBLIC_IP:4000/graphql"
echo ""
echo "📌 Next steps:"
echo "   1. Wait ~5 minutes for EC2 to finish initializing"
echo "   2. SSH into EC2: ssh -i ~/.ssh/${APP_NAME}-key.pem ec2-user@$EC2_PUBLIC_IP"
echo "   3. Clone your repo: git clone https://github.com/YOUR_USER/myapp.git /home/ec2-user/app"
echo "   4. Set up environment variables on EC2"
echo "   5. Add GitHub Secrets and push to main branch"
echo ""

