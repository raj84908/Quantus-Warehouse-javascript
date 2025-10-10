# 📋 Production Deployment Checklist

## Pre-Deployment Security

### 🔐 Credentials & Secrets

- [ ] **Change default admin password**
  - Current: `admin@quantus.com` / `Admin@123`
  - Create strong password (16+ chars, mixed case, numbers, symbols)
  - Update via database or create new admin account

- [ ] **Generate new NEXTAUTH_SECRET**
  ```bash
  openssl rand -base64 32
  ```
  - Update in production environment variables
  - Never use the development secret in production

- [ ] **Review access keys**
  - Deactivate development/test keys
  - Create production keys with appropriate limits
  - Set expiration dates where applicable

- [ ] **Rotate all API keys**
  - Shopify credentials (if using)
  - Any third-party integrations
  - Database passwords

### 🗄️ Database

- [ ] **Production database setup**
  - Use managed PostgreSQL service (AWS RDS, Railway, Neon, Supabase)
  - Enable SSL/TLS connections (`sslmode=require`)
  - Configure automatic backups (daily minimum)
  - Set up point-in-time recovery

- [ ] **Database security**
  - Create dedicated user with minimal permissions
  - Disable public access to database
  - Use connection pooling (Prisma's built-in pooler or PgBouncer)
  - Enable query logging for auditing

- [ ] **Run migrations**
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```

- [ ] **Seed initial data**
  ```bash
  node scripts/create-admin.js
  ```

### 🌐 Hosting & Infrastructure

- [ ] **Domain & DNS**
  - Purchase and configure domain
  - Set up DNS records
  - Configure SSL certificate (Let's Encrypt, Cloudflare)

- [ ] **Deploy to hosting platform**
  - Vercel (recommended for Next.js)
  - Netlify
  - Railway
  - AWS / Google Cloud / Azure

- [ ] **Configure environment variables on hosting platform**
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (your production domain)
  - `NODE_ENV=production`
  - Shopify credentials (if applicable)

- [ ] **Enable HTTPS only**
  - Force HTTPS redirects
  - HSTS headers already configured in `next.config.mjs`

### 🛡️ Security Hardening

- [ ] **Review SECURITY.md**
  - Implement all recommendations
  - Address known limitations

- [ ] **Configure rate limiting for production**
  - Set up Redis for distributed rate limiting
  - Or use Cloudflare rate limiting
  - Or Vercel Edge Config

- [ ] **Add monitoring & alerting**
  - Error tracking (Sentry, Bugsnag)
  - Performance monitoring (Vercel Analytics, New Relic)
  - Uptime monitoring (UptimeRobot, Pingdom)

- [ ] **Set up logging**
  - Application logs (Winston, Pino)
  - Security event logs
  - Failed login attempt logs
  - Admin action audit trail

- [ ] **CORS configuration**
  - If using separate frontend, configure allowed origins
  - Add to `next.config.mjs` if needed

## Testing Before Go-Live

### ✅ Functional Testing

- [ ] **Authentication flows**
  - [ ] Customer signup with access key
  - [ ] Customer login
  - [ ] Admin login
  - [ ] Logout functionality
  - [ ] Password requirements enforced
  - [ ] Invalid credentials rejected

- [ ] **Multi-tenancy isolation**
  - [ ] Create 2 test organizations
  - [ ] Verify Org A cannot see Org B's data
  - [ ] Test products, orders, categories, people
  - [ ] Verify organization IDs in all database queries

- [ ] **Organization suspension**
  - [ ] Suspend an organization via admin panel
  - [ ] Verify suspended org cannot login
  - [ ] Reactivate and verify login works again

- [ ] **Admin panel**
  - [ ] View all organizations
  - [ ] Create access keys
  - [ ] View access key usage
  - [ ] Suspend/unsuspend organizations
  - [ ] Delete organizations (test with dummy data)

- [ ] **Data operations**
  - [ ] Create, read, update, delete products
  - [ ] Create and manage orders
  - [ ] Inventory adjustments
  - [ ] Reports generation
  - [ ] Shopify sync (if enabled)

### 🔒 Security Testing

- [ ] **Input validation**
  - [ ] Try XSS attacks in form fields
  - [ ] Test SQL injection attempts
  - [ ] Submit invalid data formats
  - [ ] Test max length validations

- [ ] **Rate limiting**
  - [ ] Attempt 20+ signups rapidly (should block)
  - [ ] Attempt 10+ admin logins rapidly (should block)
  - [ ] Verify rate limit reset after timeout

- [ ] **Authorization**
  - [ ] Try accessing API routes without authentication
  - [ ] Try accessing other org's data via API
  - [ ] Try admin routes without admin token

- [ ] **Session security**
  - [ ] Verify JWT expiration works
  - [ ] Test logout clears session
  - [ ] Verify no sensitive data in JWT payload

### 📊 Performance Testing

- [ ] **Load testing**
  - [ ] Test with 100+ products
  - [ ] Test with 1000+ orders
  - [ ] Measure page load times
  - [ ] Check database query performance

- [ ] **Database indexes**
  - [ ] Verify indexes on organizationId columns
  - [ ] Check slow query log
  - [ ] Optimize if needed

## Post-Deployment

### 📈 Monitoring Setup

- [ ] **Configure alerts**
  - [ ] Error rate threshold exceeded
  - [ ] Response time degradation
  - [ ] Database connection failures
  - [ ] Disk space warnings

- [ ] **Set up dashboards**
  - [ ] Application health
  - [ ] User activity
  - [ ] Database performance
  - [ ] Error rates

### 📝 Documentation

- [ ] **Update README.md**
  - [ ] Production URL
  - [ ] Deployment instructions
  - [ ] Contact information

- [ ] **Create runbooks**
  - [ ] How to create new admin
  - [ ] How to suspend organization
  - [ ] How to restore from backup
  - [ ] How to rotate secrets

- [ ] **User documentation**
  - [ ] Getting started guide
  - [ ] Feature documentation
  - [ ] FAQ
  - [ ] Support contact

### 🔄 Ongoing Maintenance

- [ ] **Set up backup verification**
  - [ ] Test database restoration monthly
  - [ ] Verify backup retention policy
  - [ ] Document restoration procedure

- [ ] **Security updates**
  - [ ] Enable Dependabot or similar
  - [ ] Review npm audit monthly
  - [ ] Update dependencies regularly
  - [ ] Subscribe to security advisories

- [ ] **Access reviews**
  - [ ] Review admin accounts quarterly
  - [ ] Audit access keys monthly
  - [ ] Check organization statuses
  - [ ] Remove inactive accounts

## Rollback Plan

### If Issues Occur

1. **Database issues:**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup.sql
   ```

2. **Application errors:**
   - Revert to previous deployment
   - Check error logs
   - Fix and redeploy

3. **Emergency contacts:**
   - Database admin: [contact]
   - Infrastructure admin: [contact]
   - On-call developer: [contact]

## Go-Live Checklist

- [ ] All pre-deployment tasks complete
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Team notified
- [ ] Support ready
- [ ] Rollback plan documented

---

## Quick Reference

### Essential URLs
- **Production App:** https://yourdomain.com
- **Admin Panel:** https://yourdomain.com/admin/login
- **Database:** [Your hosting platform dashboard]
- **Monitoring:** [Your monitoring dashboard]

### Essential Commands
```bash
# View production logs
vercel logs [deployment-url]

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View database in studio
npx prisma studio

# Check npm vulnerabilities
npm audit
```

### Emergency Procedures
1. **Site is down:** Check hosting platform status
2. **Database unreachable:** Check database service status
3. **High error rate:** Check error monitoring dashboard
4. **Security breach:** Rotate all secrets immediately

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Sign-off:** _____________
