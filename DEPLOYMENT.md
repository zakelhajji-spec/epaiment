# Epaiement.ma - Production Deployment Guide

## Overview

This guide covers the steps required to deploy Epaiement.ma to production with proper security, scalability, and compliance.

---

## 1. Infrastructure Requirements

### Minimum Production Stack

| Component | Recommended | Alternative |
|-----------|-------------|-------------|
| Hosting | Vercel Pro | AWS, DigitalOcean |
| Database | Neon PostgreSQL | Supabase, Railway |
| Redis | Upstash Redis | Redis Cloud |
| Storage | AWS S3 | Cloudflare R2 |
| CDN | Cloudflare | Vercel Edge Network |
| Monitoring | Sentry | Datadog |

### Server Requirements (if self-hosting)

- **CPU**: 2+ cores
- **RAM**: 4GB minimum
- **Storage**: 20GB SSD minimum
- **OS**: Ubuntu 22.04 LTS

---

## 2. Environment Variables Setup

### Required Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://epaiement.ma
NEXT_PUBLIC_APP_NAME=Epaiement.ma

# Database
DATABASE_URL=postgresql://user:password@host:5432/epaiement?sslmode=require

# Security (Generate with: openssl rand -base64 32)
ENCRYPTION_KEY=<your-32-byte-encryption-key>
ENCRYPTION_SALT=<your-encryption-salt>
SESSION_SECRET=<your-session-secret>
NEXTAUTH_SECRET=<your-nextauth-secret>
NEXTAUTH_URL=https://epaiement.ma

# Redis
REDIS_URL=rediss://default:password@host:6379

# Payment Gateways (Use separate secrets manager!)
CMI_MERCHANT_ID=<from-cmi>
CMI_SECRET_KEY=<from-cmi>
CMI_TEST_MODE=false

FATOURATI_MERCHANT_ID=<from-fatourati>
FATOURATI_SECRET_KEY=<from-fatourati>
FATOURATI_TEST_MODE=false

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@epaiement.ma

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_2FA=true
ENABLE_API_ACCESS=true
ENABLE_PAYMENT_PROCESSING=true
```

---

## 3. Database Setup

### Step 1: Create Database

```bash
# Using Neon (recommended)
# 1. Go to console.neon.tech
# 2. Create new project "epaiement-production"
# 3. Copy DATABASE_URL

# Using PostgreSQL directly
sudo -u postgres psql
CREATE DATABASE epaiement_production;
CREATE USER epaiement WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE epaiement_production TO epaiement;
```

### Step 2: Run Migrations

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Or use migrations (recommended for production)
bunx prisma migrate deploy
```

### Step 3: Enable Extensions (PostgreSQL)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 4. Security Configuration

### Step 1: SSL/TLS Certificate

```bash
# Using Certbot (self-hosted)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d epaiement.ma -d www.epaiement.ma

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Step 2: Configure Cloudflare (recommended)

1. Add domain to Cloudflare
2. Enable "Full (Strict)" SSL mode
3. Enable "Always Use HTTPS"
4. Enable "HSTS" with max-age=31536000
5. Enable "Browser Integrity Check"
6. Configure WAF rules

### Step 3: Security Headers

Already configured in `next.config.ts`:
- HSTS
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options

### Step 4: Rate Limiting with Redis

```typescript
// Update src/lib/security.ts to use Redis
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

export async function rateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const result = await redis.incr(key)
  
  if (result === 1) {
    await redis.expire(key, Math.floor(windowMs / 1000))
  }
  
  return {
    success: result <= maxRequests,
    remaining: Math.max(0, maxRequests - result),
    resetTime: Date.now() + windowMs
  }
}
```

---

## 5. Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL --scope production
vercel env add NEXTAUTH_SECRET --scope production
# ... add all other variables
```

### Option B: Docker (Self-hosted)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t epaiement .
docker run -p 3000:3000 --env-file .env.production epaiement
```

### Option C: PM2 (VPS)

```bash
# Install PM2
npm install -g pm2

# Build application
bun run build

# Start with PM2
pm2 start npm --name "epaiement" -- start

# Save PM2 config
pm2 save
pm2 startup
```

---

## 6. Post-Deployment Checklist

### Security Checklist

- [ ] SSL certificate installed and valid
- [ ] All environment variables set
- [ ] Database SSL enabled
- [ ] Redis connection secured
- [ ] Rate limiting working
- [ ] Security headers verified (check at securityheaders.com)
- [ ] CSP policy tested
- [ ] 2FA enabled for admin accounts
- [ ] API keys rotated
- [ ] Default credentials changed

### Functional Checklist

- [ ] User registration working
- [ ] Email verification sending
- [ ] Login/logout working
- [ ] Password reset working
- [ ] Invoice creation working
- [ ] Payment gateway integration tested (sandbox mode)
- [ ] PDF generation working
- [ ] QR codes generating
- [ ] WhatsApp sharing working
- [ ] Reports generating

### Monitoring Setup

```bash
# Install Sentry SDK (already in package.json)
# Create sentry.client.config.ts

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: 'production',
})
```

---

## 7. Backup Strategy

### Database Backups

```bash
# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "$BACKUP_DIR/epaiement_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to S3
aws s3 cp "$BACKUP_DIR/epaiement_$DATE.sql" s3://epaiement-backups/
```

### Cron Job

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

---

## 8. Scaling Considerations

### Horizontal Scaling

- Use Vercel Edge Functions for global distribution
- Enable database read replicas for read-heavy operations
- Use CDN for static assets

### Vertical Scaling

- Increase database plan (Neon Pro)
- Add more Redis memory (Upstash)
- Enable Vercel Pro for more bandwidth

---

## 9. PCI DSS Compliance Checklist

For processing real payments:

- [ ] PCI DSS Self-Assessment Questionnaire (SAQ) completed
- [ ] Quarterly vulnerability scans
- [ ] Annual penetration testing
- [ ] Web Application Firewall (WAF) enabled
- [ ] Cardholder data environment isolated
- [ ] Encryption at rest and in transit
- [ ] Access control and audit logging
- [ ] Incident response plan documented

---

## 10. Monitoring & Alerts

### Health Check Endpoint

Create `/api/health/route.ts`:

```typescript
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage(),
  }
  
  const healthy = Object.values(checks).every(v => v)
  
  return Response.json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  }, { status: healthy ? 200 : 503 })
}
```

### Alerting Rules

- Database connection failures
- Redis connection failures
- High error rate (>1%)
- Response time >2s
- Certificate expiry <7 days

---

## Support

For deployment issues:
- Check Vercel logs: `vercel logs --follow`
- Check application logs: `vercel logs --output raw`
- Database issues: Check Neon dashboard
- Redis issues: Check Upstash dashboard
