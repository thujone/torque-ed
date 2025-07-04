# TorqueEd Staging Deployment Guide - DigitalOcean Ubuntu 24.10

This guide provides step-by-step instructions for deploying TorqueEd to your DigitalOcean staging environment.

## Server Information
- **Droplet Name**: ubuntu-torque-ed-1
- **IPv4**: 104.131.171.237
- **Private IP**: 10.108.0.3
- **OS**: Ubuntu 24.10 x64
- **Specs**: 1 GB Memory / 1 AMD vCPU / 25 GB Disk
- **Location**: NYC3

## Step-by-Step Deployment

### Step 1: Initial Server Access
```bash
# From your local machine, SSH as root
ssh root@104.131.171.237
```

### Step 2: Server Setup & Security
```bash
# Update system packages
apt update && apt upgrade -y

# Create a new user
adduser torqueed
# Enter a secure password when prompted

# Grant sudo privileges
usermod -aG sudo torqueed

# Exit and copy your SSH key from local machine
exit

# From your local machine
ssh-copy-id torqueed@104.131.171.237

# SSH back in as the new user
ssh torqueed@104.131.171.237

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3030/tcp
sudo ufw enable
# Type 'y' when prompted
```

### Step 3: Install Node.js 20.x LTS
```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add NodeSource GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Add NodeSource repository
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Install Node.js
sudo apt-get update
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install and Configure PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
```

In the PostgreSQL prompt, run:
```sql
CREATE USER torqueed_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
CREATE DATABASE torqueed_staging OWNER torqueed_user;
GRANT ALL PRIVILEGES ON DATABASE torqueed_staging TO torqueed_user;
\q
```

Configure PostgreSQL for password authentication:
```bash
sudo sed -i '/^local/s/peer/scram-sha-256/' /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
```

### Step 5: Install PM2 and Nginx
```bash
# Install PM2
sudo npm install -g pm2

# Set up PM2 startup
pm2 startup systemd
# Copy and run the command it outputs

# Install Nginx
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Deploy TorqueEd Application
```bash
# Clone your repository
cd ~
git clone https://github.com/YOUR_USERNAME/torque-ed.git
cd torque-ed

# Install dependencies
npm install

# Create environment file
nano .env.staging
```

Add the following content (replace placeholders):
```bash
NODE_ENV=production
PORT=3030
DATABASE_URL=postgresql://torqueed_user:YOUR_SECURE_PASSWORD_HERE@localhost:5432/torqueed_staging
SESSION_SECRET=GENERATE_A_32_PLUS_CHARACTER_RANDOM_STRING_HERE
FRONTEND_URL=http://104.131.171.237
BACKEND_URL=http://104.131.171.237
```

Save and exit (Ctrl+X, Y, Enter)

### Step 7: Build and Start Application
```bash
# Build the application
npm run build

# Run database migrations
npm run prisma migrate deploy

# Seed initial data (optional)
npm run seed

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following:
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
    max_memory_restart: '900M'
  }]
};
```

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs torqueed-staging --lines 50
```

### Step 8: Configure Nginx Reverse Proxy
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/torqueed
```

Add the following:
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
    }

    location /health {
        access_log off;
        proxy_pass http://localhost:3030/health;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/torqueed /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 9: Test Your Deployment
1. Open your browser and navigate to: http://104.131.171.237
2. You should see the KeystoneJS admin interface
3. Create your first admin user when prompted
4. The user will automatically have superAdmin role

### Step 10: Create Deployment Script
```bash
# Create deployment script for easy updates
cd ~/torque-ed
nano deploy.sh
```

Add:
```bash
#!/bin/bash
set -e

echo "Deploying TorqueEd updates..."
git pull origin main
npm install
npm run build
npm run prisma migrate deploy
pm2 restart torqueed-staging
echo "Deployment complete!"
pm2 status
```

```bash
chmod +x deploy.sh
```

## Maintenance Commands

### View Logs
```bash
# Application logs
pm2 logs torqueed-staging

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart application
pm2 restart torqueed-staging

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Update Application
```bash
cd ~/torque-ed
./deploy.sh
```

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs torqueed-staging --lines 100

# Check if port is in use
sudo lsof -i :3030

# Check database connection
psql -U torqueed_user -d torqueed_staging -h localhost
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check if Nginx is listening
sudo netstat -tlnp | grep nginx
```

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

## Security Notes
1. Remember to change the default PostgreSQL password
2. Generate a strong SESSION_SECRET
3. Consider setting up fail2ban for additional security
4. Regularly update system packages: `sudo apt update && sudo apt upgrade`
5. Monitor disk usage: `df -h`

## Next Steps
1. Set up a domain name and configure DNS
2. Install SSL certificate with Let's Encrypt
3. Set up automated backups
4. Configure monitoring (e.g., UptimeRobot)
5. Set up log rotation

## Support
For issues or questions, contact: rich@comfypants.org