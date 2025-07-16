# Better Auth Implementation Plan

## 🎯 **Current Status**

### ✅ **Working Features**
- Basic email/password authentication
- Admin plugin with role-based access
- Phone number authentication with Twilio SMS
- Session management with secure cookies
- Prisma database integration
- Next.js middleware protection

### ⚠️ **Temporarily Disabled** (Due to hex string error)
- Two-Factor Authentication (2FA)
- Email verification

## 🔧 **Step-by-Step Implementation**

### **Phase 1: Get Basic Auth Working** (Current Focus)
1. ✅ **Test basic email/password login** - Ensure core functionality works
2. ✅ **Test phone number authentication** - Verify SMS OTP works
3. ✅ **Test admin role system** - Verify role-based access
4. ✅ **Test session management** - Check login/logout flow

### **Phase 2: Add Security Features**
1. **Email Verification** - Re-enable once basic auth works
2. **Rate Limiting** - Prevent brute force attacks
3. **Password Security** - HaveIBeenPwned integration

### **Phase 3: Advanced Authentication**
1. **Two-Factor Authentication** - TOTP with QR codes
2. **Multi-Session Management** - Device management
3. **Session Security** - Enhanced session validation

## 🔍 **Current Issue: Hex String Error**

The error `hex string expected, got undefined` suggests:
- A plugin is trying to parse a hex string that's undefined
- This could be related to crypto operations in 2FA or email verification
- Need to isolate which plugin is causing the issue

## 💡 **Testing Strategy**

### **1. Test Current Basic Setup**
```bash
# Start the dev server
npm run dev

# Test basic login at http://localhost:3000/signin
# Try creating an account and logging in
```

### **2. Debug Process**
- Test with minimal configuration first
- Add plugins one by one
- Monitor console for detailed error messages
- Check database connectivity

### **3. Gradual Feature Addition**
```typescript
// Start with minimal config
plugins: [
  admin(),
  nextCookies()
]

// Then add phone number
plugins: [
  admin(),
  phoneNumber({ /* config */ }),
  nextCookies()
]

// Then add other features one by one
```

## 🛠️ **Implementation Commands**

### **Database Setup**
```bash
# Generate Prisma schema for Better Auth
npx @better-auth/cli generate --config src/lib/auth/auth-server.ts

# Run database migration
npx prisma migrate dev --name better-auth-setup

# Generate Prisma client
npm run db:generate
```

### **Test Email Service** (When re-enabling)
```typescript
// Test email service in isolation
import { sendEmail } from '@/lib/email/email-service';

await sendEmail(
  'test@example.com',
  'Test Email',
  '<h1>Test</h1>'
);
```

### **Test SMS Service**
```typescript
// Test SMS service in isolation
import { sendSMS } from '@/lib/sms/sms-service';

await sendSMS('+1234567890', '123456');
```

## 📋 **Environment Variables Needed**

### **Current (Working)**
```bash
BETTER_AUTH_SECRET=your-32-character-secret
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

### **For Email Features** (When re-enabling)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **For Enhanced Security** (Future)
```bash
REDIS_URL=redis://localhost:6379
HIBP_API_KEY=your-hibp-api-key
```

## 🔄 **Re-enabling Features**

### **1. Email Verification**
```typescript
// In auth-server.ts
providers: {
  emailAndPassword: {
    enabled: true,
    requiredEmailVerfication: true,
    sendEmailVerification: async ({ user, url }) => {
      const { sendEmailVerification } = await import('../email/email-service');
      await sendEmailVerification(user.email, url);
    },
  },
}
```

### **2. Two-Factor Authentication**
```typescript
// In auth-server.ts
import { twoFactor } from 'better-auth/plugins/two-factor';

plugins: [
  // ... other plugins
  twoFactor({
    issuer: 'Kajen Traders',
    totpOptions: {
      period: 30,
      digits: 6,
      algorithm: 'SHA1'
    }
  }),
]
```

### **3. Client-Side Integration**
```typescript
// In auth-client.ts
import { twoFactorClient } from 'better-auth/client/plugins';

plugins: [
  adminClient(),
  phoneNumberClient(),
  twoFactorClient()
]
```

## 🧪 **Testing Checklist**

### **Basic Authentication**
- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Session persistence works
- [ ] Protected routes work

### **Phone Number Authentication**
- [ ] SMS OTP sending works
- [ ] OTP verification works
- [ ] Phone number sign-up works
- [ ] Phone number sign-in works

### **Admin Features**
- [ ] Admin role assignment works
- [ ] Admin-only routes work
- [ ] Admin panel access works
- [ ] User management works

### **Security Features** (When re-enabled)
- [ ] Email verification works
- [ ] 2FA setup works
- [ ] 2FA login works
- [ ] Rate limiting works
- [ ] Password security checks work

## 🚀 **Next Steps**

1. **Test current basic setup** - Verify core functionality
2. **Fix hex string error** - Isolate and resolve the issue
3. **Re-enable email verification** - Add back email features
4. **Add 2FA support** - Implement TOTP authentication
5. **Add security enhancements** - Rate limiting, password checks
6. **Test thoroughly** - Ensure all features work together

## 📞 **Troubleshooting**

### **Common Issues**
1. **Environment variables not loaded** - Check .env.local file
2. **Database connection issues** - Verify DATABASE_URL
3. **SMS not sending** - Check Twilio credentials
4. **Email not sending** - Check SMTP configuration
5. **Hex string error** - Usually plugin-related, disable and re-enable

### **Debug Commands**
```bash
# Check environment variables
echo $BETTER_AUTH_SECRET

# Check database connection
npx prisma studio

# Check build errors
npm run build

# Check runtime errors
npm run dev
```

This plan provides a systematic approach to implementing Better Auth features while avoiding the current hex string error.
