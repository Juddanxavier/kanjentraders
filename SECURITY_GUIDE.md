# 🔒 Security Guide - Bulletproof Authentication System

## 🛡️ Security Architecture Overview

This application implements a **3-layer security system** with Better Auth and Prisma:

### Layer 1: Middleware (Fast UX)
- **Purpose**: Fast cookie-based redirects
- **Speed**: ~1ms response time
- **Security**: Basic cookie existence check
- **File**: `middleware.ts`

### Layer 2: Layout (Full Validation)
- **Purpose**: Complete session and role validation
- **Speed**: ~50ms response time
- **Security**: Database session validation + role checks
- **Files**: `src/app/admin/layout.tsx`, `src/app/dashboard/layout.tsx`

### Layer 3: Component (Action-Specific)
- **Purpose**: Granular permissions for sensitive actions
- **Speed**: Variable
- **Security**: Action-specific permission checks
- **Files**: Individual components

## 🚀 Route Protection Matrix

| Route | Access Level | Middleware | Layout | Component |
|-------|-------------|------------|---------|-----------|
| `/` | Public | ✅ Allow | ❌ None | ❌ None |
| `/signin` | Public | ✅ Allow | ❌ None | ❌ None |
| `/signup` | Public | ✅ Allow | ❌ None | ❌ None |
| `/dashboard` | User | 🔒 Cookie check | 🔒 Session validation | ✅ User data |
| `/admin` | Admin | 🔒 Cookie check | 🔒 Session + Role validation | ✅ Admin data |

## 🔐 Security Features

### ✅ Authentication
- **Better Auth** with Prisma adapter
- **Email/Password** authentication
- **Session management** with secure cookies
- **Admin role system** with granular permissions

### ✅ Authorization
- **Role-based access control** (User, Admin)
- **Route-level protection** via middleware
- **Component-level protection** via layouts
- **Action-level protection** via permissions

### ✅ Security Headers
- **Strict-Transport-Security**: Force HTTPS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **Referrer-Policy**: Control referrer information

### ✅ Account Security
- **Account banning** system
- **Ban reason tracking**
- **Ban expiration** support
- **Email verification** (configurable)

## 🛠️ Adding New Protected Routes

### User Protected Route
```typescript
// 1. Add to route-utils.ts
userProtected: [
  '/dashboard',
  '/profile',
  '/orders',
  '/new-user-route'  // Add here
]

// 2. Create page under /dashboard or create new layout
```

### Admin Protected Route
```typescript
// 1. Add to route-utils.ts
adminOnly: [
  '/admin',
  '/admin/new-feature'  // Add here
]

// 2. Create page under /admin
```

## 🔍 Security Monitoring

### Audit Logging
All security events are logged:
- ✅ Successful admin access
- ❌ Failed authentication attempts
- ⚠️ Unauthorized access attempts
- 🚫 Banned account access attempts

### Log Format
```javascript
console.log('Security event', {
  event: 'admin_access_granted',
  userId: 'user123',
  userEmail: 'admin@example.com',
  timestamp: new Date().toISOString(),
  ip: request.ip,
  userAgent: request.headers['user-agent']
});
```

## 🧪 Security Testing

### Test Scenarios
1. **Unauthenticated access** → Should redirect to signin
2. **Non-admin accessing admin** → Should redirect to dashboard
3. **Banned user access** → Should redirect to signin with error
4. **Session expiration** → Should redirect to signin
5. **Role change** → Should update access immediately

### Test Commands
```bash
# Test middleware
curl -i http://localhost:3000/admin
# Should redirect to signin

# Test with session
curl -i -H "Cookie: kajen-traders-session=valid_session" http://localhost:3000/admin
# Should allow access if admin
```

## 🚨 Security Incidents

### If Security Breach
1. **Immediately revoke all sessions**
2. **Force password reset** for all users
3. **Review audit logs** for suspicious activity
4. **Update security measures** as needed

### Emergency Commands
```bash
# Revoke all sessions (add to auth config)
await auth.api.revokeAllSessions()

# Ban suspicious user
await prisma.user.update({
  where: { id: 'user123' },
  data: { banned: true, banReason: 'Security incident' }
})
```

## 📋 Security Checklist

### Pre-Production
- [ ] Environment variables set correctly
- [ ] HTTPS enforced in production
- [ ] Database connections secured
- [ ] Rate limiting configured
- [ ] Security headers active
- [ ] Audit logging enabled

### Regular Maintenance
- [ ] Review user roles monthly
- [ ] Check banned accounts quarterly
- [ ] Update dependencies regularly
- [ ] Review security logs weekly
- [ ] Test backup authentication methods

## 🔧 Configuration

### Environment Variables
```bash
# Required
BETTER_AUTH_SECRET=your-32-character-secret
BETTER_AUTH_URL=https://yourapp.com
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional
BETTER_AUTH_TRUSTED_ORIGINS=https://yourapp.com
```

### Security Settings
```typescript
// In auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 minutes
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookieName: 'kajen-traders-session',
  }
}
```

## 📞 Support

### Security Questions
For security-related questions, contact:
- Email: security@yourapp.com
- Slack: #security-team

### Reporting Vulnerabilities
Please report security vulnerabilities through:
- Email: security@yourapp.com
- Encrypted: Use our PGP key

---

## 🎯 Summary

This security system provides:
- **Fast user experience** with middleware redirects
- **Bulletproof security** with multi-layer validation
- **Scalable architecture** for adding new features
- **Comprehensive monitoring** for security incidents
- **Easy maintenance** with clear documentation

**Remember**: Security is only as strong as its weakest link. Always validate user permissions at every layer.
