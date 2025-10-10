# 🔒 Security Guide - Quantus Warehouse

## ⚠️ CRITICAL: Before Production Deployment

### 1. **Change Default Credentials**
```bash
# Current admin credentials (CHANGE THESE!)
Email: admin@quantus.com
Password: Admin@123
```

**Action Required:**
- Login to the database and update the SuperAdmin password hash
- Use a strong password: minimum 16 characters, mix of uppercase, lowercase, numbers, symbols
- Never use default credentials in production

### 2. **Secure Environment Variables**

**✅ DO:**
- Copy `.env.example` to `.env`
- Generate a new `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
- Use strong, unique values for all secrets
- Store production secrets in your hosting platform's secure environment variables

**❌ DON'T:**
- Never commit `.env` to version control (it's in `.gitignore`)
- Never share API keys or secrets in code
- Never use the same secrets across environments

### 3. **Database Security**

**Ensure:**
- PostgreSQL connection uses SSL (`sslmode=require`)
- Database user has minimal required permissions
- Regular backups are configured
- Database credentials are rotated quarterly

### 4. **Access Key Management**

**Best Practices:**
- Rotate access keys regularly
- Set expiration dates for promotional keys
- Monitor key usage in admin dashboard
- Deactivate unused keys immediately

---

## 🛡️ Security Features Implemented

### Authentication & Authorization

#### ✅ Password Security
- **Bcrypt hashing** with salt rounds of 12
- **Minimum 8 characters** required
- Passwords validated for:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Stored passwords are never logged or exposed in responses

#### ✅ Session Management
- **JWT tokens** with 30-day expiration for users
- **24-hour expiration** for admin tokens
- Secure HTTP-only cookies (when using NextAuth properly)
- Session validation on every authenticated request

#### ✅ Organization Suspension
- Suspended organizations **cannot login**
- Checked during authentication process
- All sessions invalidated when suspended
- Data preserved but inaccessible

### Multi-Tenant Data Isolation

#### ✅ Row-Level Security
- Every query filters by `organizationId`
- Users can only access their organization's data
- Category validation prevents cross-org data access
- API routes use `withAuth()` wrapper for automatic filtering

#### ✅ Database Constraints
- Unique constraints include `organizationId`
- Foreign keys with CASCADE delete
- Indexes on organization-scoped queries

### Input Validation & Sanitization

#### ✅ Validation Library (Zod)
- Schema-based validation for all user inputs
- Type-safe validation with TypeScript support
- Custom validation rules per entity

#### ✅ XSS Protection
- All string inputs are HTML-escaped
- Validator library sanitizes user input
- No raw HTML rendering from user data

#### ✅ SQL Injection Protection
- **Prisma ORM** used for all database queries
- Parameterized queries only
- No raw SQL with user input

### Rate Limiting

#### ✅ Implemented Rate Limits
- **Signup**: 10 attempts per IP per hour
- **Admin Login**: 5 attempts per IP per 15 minutes
- **Regular Login**: Protected by NextAuth
- Returns 429 status with retry-after info

**Note:** Current implementation uses in-memory store. For production with multiple servers, use Redis.

### Admin Panel Security

#### ✅ Separate Authentication
- Admin tokens separate from user sessions
- JWT-based with short expiration (24h)
- Email/password authentication required
- Admin actions require valid token

#### ✅ Authorization Checks
- All admin routes verify JWT token
- Organization operations check admin permissions
- Destructive actions (delete) require confirmation on frontend

---

## 🚨 Known Limitations & Recommendations

### 1. **Admin Token Storage** ⚠️
**Current:** Tokens stored in `localStorage`
**Risk:** Vulnerable to XSS attacks
**Production Fix:**
- Move to HTTP-only cookies
- Or implement refresh token rotation
- Add CSRF protection

### 2. **Rate Limiting** ⚠️
**Current:** In-memory Map (single server only)
**Production Fix:**
```bash
npm install ioredis
```
Then implement Redis-based rate limiting for multi-server deployments.

### 3. **HTTPS Required** ⚠️
**Production Requirement:**
- Always use HTTPS in production
- Enable HSTS headers
- Use secure cookies only

### 4. **Logging & Monitoring** ⚠️
**Add These:**
- Failed login attempt logging
- Admin action audit log
- Suspicious activity alerts
- Error tracking (Sentry, LogRocket, etc.)

### 5. **CORS Configuration** ⚠️
**Current:** Not configured
**Production:** Add proper CORS headers in `next.config.js`

---

## 📋 Security Checklist

### Pre-Production

- [ ] Change default admin password
- [ ] Generate new `NEXTAUTH_SECRET`
- [ ] Verify `.env` is in `.gitignore`
- [ ] Create `.env.production` with secure values
- [ ] Review all access keys and their limits
- [ ] Enable HTTPS on hosting platform
- [ ] Configure database SSL
- [ ] Set up automatic backups
- [ ] Implement Redis for rate limiting (if multi-server)
- [ ] Add error monitoring service
- [ ] Configure logging service
- [ ] Add CSRF tokens
- [ ] Enable security headers
- [ ] Perform penetration testing
- [ ] Review all API routes for authorization
- [ ] Test organization data isolation
- [ ] Verify suspended orgs cannot login
- [ ] Test rate limiting on all auth endpoints

### Ongoing Maintenance

- [ ] Rotate secrets quarterly
- [ ] Review admin access monthly
- [ ] Audit access key usage monthly
- [ ] Update dependencies for security patches
- [ ] Review error logs weekly
- [ ] Monitor failed login attempts
- [ ] Backup database daily
- [ ] Test restoration procedures quarterly

---

## 🔧 Security Headers (Add to next.config.js)

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ]
    }
  ]
}
```

---

## 🐛 Vulnerability Reporting

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security details to: [your-security-email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

---

## 📚 Security Resources

### Password Hashing
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### JWT Security
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### API Security
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

### Multi-Tenancy
- [SaaS Security Best Practices](https://aws.amazon.com/compliance/shared-responsibility-model/)

---

## 🔐 Security Updates Log

| Date | Version | Update |
|------|---------|--------|
| 2025-01 | 1.0 | Initial security implementation |
| 2025-01 | 1.1 | Added organization suspension enforcement |
| 2025-01 | 1.2 | Added input validation and sanitization |
| 2025-01 | 1.3 | Added rate limiting on auth endpoints |
| 2025-01 | 1.4 | Added category cross-org validation |

---

**Last Updated:** January 2025
**Maintained By:** Development Team
