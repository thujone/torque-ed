# DEPLOYMENT.md - Infrastructure & Deployment

## Overview

This document covers deployment procedures for TorqueEd, including local development, staging, and production environments. The application is containerized with Docker and can be deployed to AWS or DigitalOcean.

## Prerequisites

### Required Tools
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20.x LTS
- Yarn package manager
- PostgreSQL client tools
- AWS CLI (for AWS deployment)
- kubectl (for Kubernetes deployment)

### Required Services
- PostgreSQL 15+
- SMTP server (SendGrid, AWS SES, etc.)
- S3-compatible storage (AWS S3, DigitalOcean Spaces)
- Domain with DNS management

## Environment Configuration

### Environment Variables

Create `.env` files for each environment:

```bash
# .env.production
NODE_ENV=production
PORT=3030

# Database
DATABASE_URL=postgresql://torqueed_user:password@db.example.com:5432/torqueed_prod

# Session
SESSION_SECRET=minimum-32-character-random-string-change-this

# Application
FRONTEND_URL=https://torqueed.example.com
BACKEND_URL=https://torqueed.example.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@torqueed.example.com

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
S3_BUCKET=torqueed-uploads

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

### Security Considerations
- Never commit `.env` files
- Use strong, unique passwords
- Rotate secrets regularly
- Use AWS Secrets Manager or similar for production

## Local Development

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-org/torque-ed.git
cd torque-ed

# Install dependencies
yarn install

# Start PostgreSQL with Docker
docker-compose -f docker-compose.dev.yml up -d postgres

# Run migrations
yarn keystone prisma migrate dev

# Seed development data
yarn seed

# Start development server
yarn dev
```

### Docker Compose Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: torqueed_dev
      POSTGRES_USER: torqueed
      POSTGRES_PASSWORD: localpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3030:3030"
    environment:
      DATABASE_URL: postgresql://torqueed:localpassword@postgres:5432/torqueed_dev
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Production Build

### Multi-Stage Dockerfile
```dockerfile
# Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/yarn.lock ./

# Install production dependencies only
RUN yarn install --production --frozen-lockfile && \
    yarn cache clean

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Build Commands
```bash
# Build Docker image
docker build -t torqueed:latest .

# Tag for registry
docker tag torqueed:latest your-registry.com/torqueed:latest

# Push to registry
docker push your-registry.com/torqueed:latest
```

## AWS Deployment

### Infrastructure Setup

#### RDS PostgreSQL
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier torqueed-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username torqueed \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --vpc-security-group-ids sg-xxxxxx \
  --db-subnet-group-name torqueed-subnet-group
```

#### ECS Deployment
```yaml
# ecs-task-definition.json
{
  "family": "torqueed",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "torqueed",
      "image": "your-registry.com/torqueed:latest",
      "portMappings": [
        {
          "containerPort": 3030,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:torqueed/db"
        },
        {
          "name": "SESSION_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:torqueed/session"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/torqueed",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Application Load Balancer
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name torqueed-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Configure SSL certificate
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
AWS_REGION="us-west-2"
ECR_REPO="your-account.dkr.ecr.us-west-2.amazonaws.com/torqueed"
ECS_CLUSTER="torqueed-cluster"
ECS_SERVICE="torqueed-service"

# Build and push
echo "Building Docker image..."
docker build -t torqueed:latest .

echo "Tagging image..."
docker tag torqueed:latest $ECR_REPO:latest
docker tag torqueed:latest $ECR_REPO:$(git rev-parse --short HEAD)

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

echo "Pushing image..."
docker push $ECR_REPO:latest
docker push $ECR_REPO:$(git rev-parse --short HEAD)

echo "Updating ECS service..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment initiated. Check ECS console for status."
```

## DigitalOcean Deployment (Ubuntu 24.10)

### Initial Server Setup

```bash
# SSH into your droplet as root
ssh root@104.131.171.237

# Update system packages
apt update && apt upgrade -y

# Create a new user with sudo privileges
adduser torqueed
usermod -aG sudo torqueed

# Set up SSH key for the new user (from your local machine)
# First, copy your SSH key to the new user
ssh-copy-id torqueed@104.131.171.237

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3030/tcp  # For development/testing
ufw enable

# Switch to the new user
su - torqueed
```

### Install Node.js 20.x LTS (via NodeSource)

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add NodeSource GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Add NodeSource repository for Node.js 20.x
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Install Node.js
sudo apt-get update
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Install PostgreSQL 16

```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Secure PostgreSQL and create database
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE USER torqueed_user WITH PASSWORD 'your-secure-password';
CREATE DATABASE torqueed_staging OWNER torqueed_user;
GRANT ALL PRIVILEGES ON DATABASE torqueed_staging TO torqueed_user;
\q

# Configure PostgreSQL for password authentication
sudo sed -i '/^local/s/peer/scram-sha-256/' /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
```

### Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Set up PM2 to start on boot
pm2 startup systemd
# Follow the command output instructions
```

### Install and Configure Nginx

```bash
# Install Nginx
sudo apt update
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Deploy TorqueEd Application

```bash
# Clone the repository
cd /home/torqueed
git clone https://github.com/your-username/torque-ed.git
cd torque-ed

# Install dependencies
npm install

# Create environment file for staging
nano .env.staging
```

Add the following to `.env.staging`:
```bash
NODE_ENV=production
PORT=3030

# Database - using local PostgreSQL
DATABASE_URL=postgresql://torqueed_user:your-secure-password@localhost:5432/torqueed_staging

# Session secret (generate a secure random string)
SESSION_SECRET=your-minimum-32-character-random-string-change-this

# Application URLs
FRONTEND_URL=http://104.131.171.237:3030
BACKEND_URL=http://104.131.171.237:3030

# Email (optional for staging)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your-sendgrid-api-key
# EMAIL_FROM=noreply@torqueed-staging.com
```

```bash
# Build the application
npm run build

# Run database migrations
DATABASE_URL="postgresql://torqueed_user:your-secure-password@localhost:5432/torqueed_staging" npm run keystone prisma migrate deploy

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following PM2 configuration:
```javascript
module.exports = {
  apps: [{
    name: 'torqueed-staging',
    script: './node_modules/.bin/keystone',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env_file: './.env.staging',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

```bash
# Create logs directory
mkdir -p logs

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Check application status
pm2 status
pm2 logs torqueed-staging
```

### Configure Nginx as Reverse Proxy

```bash
# Create Nginx server block
sudo nano /etc/nginx/sites-available/torqueed
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name 104.131.171.237;

    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3030/health;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/torqueed /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Set Up SSL with Let's Encrypt (Optional for Staging)

If you have a domain name pointing to your droplet:

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-staging-domain.com

# Auto-renewal will be set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Deployment Maintenance

```bash
# View application logs
pm2 logs torqueed-staging

# Monitor application
pm2 monit

# Restart application
pm2 restart torqueed-staging

# Update application
cd /home/torqueed/torque-ed
git pull origin main
npm install
npm run build
pm2 restart torqueed-staging

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Staging Environment Checklist

- [ ] Server security hardened (firewall, SSH keys)
- [ ] Node.js 20.x LTS installed
- [ ] PostgreSQL 16 installed and configured
- [ ] Database created with proper user permissions
- [ ] Application deployed and running with PM2
- [ ] Nginx configured as reverse proxy
- [ ] Environment variables properly configured
- [ ] Application accessible at http://104.131.171.237
- [ ] PM2 configured to restart on server reboot
- [ ] Logs being collected properly

### Quick Deployment Script

Create a deployment script for easy updates:

```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "Deploying TorqueEd to staging..."

# Navigate to project directory
cd /home/torqueed/torque-ed

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run migrations
DATABASE_URL="postgresql://torqueed_user:your-secure-password@localhost:5432/torqueed_staging" npm run keystone prisma migrate deploy

# Restart PM2
pm2 restart torqueed-staging

echo "Deployment complete!"
pm2 status
```

Make it executable:
```bash
chmod +x deploy-staging.sh
```

## Database Management

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Configuration
DB_NAME="torqueed_prod"
BACKUP_DIR="/backups"
S3_BUCKET="torqueed-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://$S3_BUCKET/

# Clean old local backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Clean old S3 backups (keep 30 days)
aws s3 ls s3://$S3_BUCKET/ | \
  awk '{print $4}' | \
  grep "backup_" | \
  sort | \
  head -n -30 | \
  xargs -I {} aws s3 rm s3://$S3_BUCKET/{}
```

### Migration Procedures
```bash
# Run migrations in production
DATABASE_URL=your-production-url yarn keystone prisma migrate deploy

# Create migration locally
yarn keystone prisma migrate dev --name your_migration_name

# Generate Prisma client
yarn keystone prisma generate
```

## Monitoring

### Health Checks
```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3030,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

### Logging Configuration
```javascript
// logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Monitoring Setup
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3031:3030"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
```

## SSL/TLS Setup

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d torqueed.example.com

# Auto-renewal cron job
echo "0 0 * * * root certbot renew --quiet" >> /etc/crontab
```

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check firewall rules
sudo ufw status
```

#### Memory Issues
```bash
# Check memory usage
docker stats

# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=2048" node dist/index.js
```

#### Permission Errors
```bash
# Fix file permissions
sudo chown -R nodejs:nodejs /app

# Check Docker permissions
docker exec -it container_id whoami
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=keystonejs:* NODE_ENV=development node dist/index.js

# Enable SQL logging
DATABASE_URL="postgresql://...?schema=public&log=query"
```

## Rollback Procedures

### Quick Rollback
```bash
#!/bin/bash
# rollback.sh

# Get previous image tag
PREVIOUS_TAG=$(aws ecr describe-images \
  --repository-name torqueed \
  --query 'sort_by(imageDetails,& imagePushedAt)[-2].imageTags[0]' \
  --output text)

# Update service with previous image
aws ecs update-service \
  --cluster torqueed-cluster \
  --service torqueed-service \
  --task-definition torqueed:$PREVIOUS_TAG
```

### Database Rollback
```bash
# Restore from backup
gunzip < backup_20250703_120000.sql.gz | psql $DATABASE_URL

# Rollback migration
yarn keystone prisma migrate resolve --rolled-back
```

## Security Checklist

- [ ] Environment variables properly secured
- [ ] Database using SSL connections
- [ ] Application behind HTTPS
- [ ] Firewall rules configured
- [ ] Regular security updates applied
- [ ] Secrets rotated quarterly
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] Rate limiting configured
- [ ] CORS properly configured

## Performance Optimization

### Database Optimization
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_attendance_lookup 
ON "AttendanceRecord" (class_meeting_id, enrollment_id);

-- Analyze tables
ANALYZE "Student";
ANALYZE "Enrollment";
ANALYZE "AttendanceRecord";
```

### Application Optimization
```bash
# Enable Node.js clustering
NODE_CLUSTER_WORKERS=4 node dist/index.js

# Enable compression
yarn add compression
```

## Disaster Recovery

### Recovery Time Objectives
- RTO: 4 hours
- RPO: 1 hour

### Recovery Procedures
1. Restore database from latest backup
2. Deploy application to new infrastructure
3. Update DNS records
4. Verify functionality
5. Notify stakeholders

This deployment guide ensures reliable, secure, and scalable deployment of TorqueEd across different environments.