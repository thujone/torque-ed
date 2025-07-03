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
PORT=3000

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
      - "3000:3000"
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
EXPOSE 3000

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
          "containerPort": 3000,
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

## DigitalOcean Deployment

### Droplet Setup
```bash
# Initial server setup
ssh root@your-droplet-ip

# Create user
adduser torqueed
usermod -aG sudo torqueed

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker torqueed

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: your-registry.com/torqueed:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env.production
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Nginx Configuration
```nginx
# nginx.conf
events {
  worker_connections 1024;
}

http {
  upstream torqueed {
    server app:3000;
  }

  server {
    listen 80;
    server_name torqueed.example.com;
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name torqueed.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
      proxy_pass http://torqueed;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
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
  port: 3000,
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
      - "3001:3000"
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