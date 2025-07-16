# Better Auth Client SDK Implementation Guide

## 🎯 **Current Implementation Status**

### ✅ **Completed Setup**
- `src/lib/auth/auth.ts` - Server-side auth configuration
- `src/lib/auth/auth-client.ts` - Client-side auth SDK
- `src/lib/auth/auth-provider.tsx` - React context provider
- `src/app/api/auth/[...all]/route.ts` - API route handler (required for Better Auth)
- Updated `src/app/layout.tsx` to use AuthProvider
- Updated `src/components/auth/signin-form.tsx` to use client SDK

### 🔧 **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Better Auth Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Side (React)          Server Side (API)            │
│  ┌─────────────────────┐      ┌─────────────────────┐       │
│  │   AuthProvider      │      │   auth.ts           │       │
│  │   (React Context)   │◄────►│   (Server Config)   │       │
│  └─────────────────────┘      └─────────────────────┘       │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────────┐      ┌─────────────────────┐       │
│  │   authClient        │      │   API Routes        │       │
│  │   (Client SDK)      │◄────►│   /api/auth/[...all]│       │
│  └─────────────────────┘      └─────────────────────┘       │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────────┐      ┌─────────────────────┐       │
│  │   Components        │      │   Database          │       │
│  │   (Sign In, etc.)   │      │   (Prisma + PG)     │       │
│  └─────────────────────┘      └─────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 **File Structure**

```
src/
├── lib/auth/
│   ├── auth.ts                 # Server-side auth configuration
│   ├── auth-client.ts          # Client-side Better Auth SDK
│   └── auth-provider.tsx       # React context provider
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider
│   └── api/auth/[...all]/route.ts # Better Auth API endpoint
└── components/auth/
    └── signin-form.tsx         # Example form using client SDK
```

## 🔧 **Key Files Explained**

### **1. Server Configuration (`auth.ts`)**
```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

export const auth = betterAuth({
  appName: 'Kajen Traders',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    admin(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // SMS logic here
      },
    }),
    nextCookies()
  ],
});
```

### **2. Client SDK (`auth-client.ts`)**
```typescript
'use client';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    adminClient(),
    phoneNumberClient()
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### **3. React Provider (`auth-provider.tsx`)**
```typescript
'use client';
import { createContext, useContext } from 'react';
import { authClient } from './auth-client';

export function AuthProvider({ children }) {
  // Context implementation with state management
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
```

### **4. API Route Handler (`route.ts`)**
```typescript
import { auth } from '@/lib/auth/auth';
import { toNextJsHandler } from 'better-auth/next-js';

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  return await handler.GET(req);
}

export async function POST(req: NextRequest) {
  return await handler.POST(req);
}
```

## 🚀 **Usage Examples**

### **1. Sign In Component**
```typescript
'use client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function SignInForm() {
  const { signIn } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await signIn.email({
      email: 'user@example.com',
      password: 'password123',
    });
    
    if (error) {
      console.error('Sign in failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### **2. Protected Component**
```typescript
'use client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function ProtectedComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

### **3. Admin-Only Component**
```typescript
'use client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function AdminComponent() {
  const { user, admin } = useAuth();
  
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <div>Access denied</div>;
  }
  
  return <div>Admin content here</div>;
}
```

### **4. Phone Number Authentication**
```typescript
'use client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function PhoneAuthForm() {
  const { phoneNumber } = useAuth();
  
  const handleSendOTP = async () => {
    const { error } = await phoneNumber.sendOtp({
      phoneNumber: '+1234567890',
    });
    
    if (error) {
      console.error('Failed to send OTP:', error);
    }
  };
  
  const handleVerifyOTP = async (code) => {
    const { error } = await phoneNumber.verifyOtp({
      phoneNumber: '+1234567890',
      otp: code,
    });
    
    if (error) {
      console.error('OTP verification failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleSendOTP}>Send OTP</button>
      {/* OTP input field */}
    </div>
  );
}
```

## 🔒 **Security Features**

### **Current Features**
- ✅ Email/Password authentication
- ✅ Admin role system
- ✅ Phone number authentication with SMS OTP
- ✅ Session management with secure cookies
- ✅ CSRF protection
- ✅ Rate limiting (via middleware)

### **Available for Implementation**
- 🔜 Two-Factor Authentication (TOTP)
- 🔜 Email verification
- 🔜 OAuth providers (Google, GitHub, etc.)
- 🔜 Magic links
- 🔜 Passkeys/WebAuthn
- 🔜 Multi-session management

## 🌐 **Environment Variables**

```bash
# Required
BETTER_AUTH_SECRET=your-64-character-hex-secret
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional (for SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Optional (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🛠️ **Development Commands**

```bash
# Start development server
npm run dev

# Generate Better Auth schema
npx @better-auth/cli generate --config src/lib/auth/auth.ts

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npm run db:generate

# Test authentication
curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🧪 **Testing**

### **Manual Testing Steps**
1. Start the development server: `npm run dev`
2. Navigate to `/signin`
3. Try signing in with valid credentials
4. Check that authentication state is managed correctly
5. Test phone number authentication if configured
6. Verify admin access controls

### **Integration Testing**
```typescript
// Example test for auth provider
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth/auth-provider';

test('AuthProvider provides authentication context', () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
  
  // Test authentication state
});
```

## 🐛 **Troubleshooting**

### **Common Issues**
1. **Hex string error**: Ensure `BETTER_AUTH_SECRET` is a valid hex string
2. **Environment variables not loaded**: Check `.env.local` file
3. **Database connection issues**: Verify `DATABASE_URL`
4. **CORS issues**: Ensure `baseURL` matches your domain
5. **Session not persisting**: Check cookie settings

### **Debug Steps**
1. Check browser developer tools for network requests
2. Verify environment variables are loaded
3. Check database connection with `npx prisma studio`
4. Test API endpoints directly with curl
5. Review server console logs for errors

## 🎯 **Next Steps**

1. **Test the basic authentication flow**
2. **Add email verification** (when needed)
3. **Implement 2FA** (for enhanced security)
4. **Add OAuth providers** (for better UX)
5. **Set up production deployment**

This implementation follows Better Auth best practices and provides a solid foundation for authentication in your Next.js application.
