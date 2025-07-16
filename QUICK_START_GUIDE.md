# ⚡ Quick Start Guide - Better-Auth Implementation

## 🚀 **Getting Started**

### **1. Environment Setup**
```bash
# Copy environment variables from .env.local
BETTER_AUTH_SECRET=MiZfDZtxF8hmBjLOD5dM5up5HYQqIpuI
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://[your-connection-string]
```

### **2. Start Development Server**
```bash
npm run dev
```

### **3. Test the System**
```bash
# Navigate to: http://localhost:3000

# Test Routes:
# Public: http://localhost:3000/
# Sign In: http://localhost:3000/signin
# Dashboard: http://localhost:3000/dashboard (requires login)
# Admin: http://localhost:3000/admin (requires admin role)
```

---

## 🔐 **Authentication Flow**

### **1. User Registration**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { signUp } = useAuth();

const handleSignUp = async (data) => {
  const result = await signUp.email({
    email: data.email,
    password: data.password,
    name: data.name
  });
  
  if (result.error) {
    console.error('Sign up failed:', result.error);
  } else {
    console.log('User created successfully');
  }
};
```

### **2. User Login**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { signIn } = useAuth();

const handleSignIn = async (data) => {
  const result = await signIn.email({
    email: data.email,
    password: data.password
  });
  
  if (result.error) {
    console.error('Sign in failed:', result.error);
  } else {
    console.log('User signed in successfully');
  }
};
```

### **3. Get Current User**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { user, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <div>Please sign in</div>;

return <div>Welcome, {user.name || user.email}!</div>;
```

### **4. Sign Out**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { signOut } = useAuth();

const handleSignOut = async () => {
  await signOut();
  // User will be redirected to sign in page
};
```

---

## 🛡️ **Permission Checks**

### **1. Check if User is Admin**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { user } = useAuth();
const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

if (isAdmin) {
  return <AdminPanel />;
}
```

### **2. Server-Side Permission Check**
```typescript
// In your server component or API route
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: await headers() });

if (!session?.user) {
  redirect('/signin');
}

const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
if (!isAdmin) {
  redirect('/unauthorized');
}
```

### **3. Use Permission Utilities**
```typescript
// Import permission helpers
import { isAdmin, canManageUsers } from '@/lib/auth/permissions';

// Check permissions
if (isAdmin(user)) {
  // User is admin or super_admin
}

if (canManageUsers(user)) {
  // User can manage other users
}
```

---

## 🔒 **Route Protection**

### **1. Protected Page (Automatic)**
```typescript
// Any page under /dashboard/* or /admin/* is automatically protected
// by middleware.ts

// src/app/dashboard/profile/page.tsx
export default function ProfilePage() {
  // This page is automatically protected
  // Only authenticated users can access it
  return <div>User Profile</div>;
}
```

### **2. Admin-Only Page (Automatic)**
```typescript
// Any page under /admin/* is automatically protected
// by middleware.ts and admin layout

// src/app/admin/users/page.tsx
export default function UsersPage() {
  // This page is automatically protected
  // Only admin users can access it
  return <div>Admin Users Management</div>;
}
```

### **3. Custom Route Protection**
```typescript
// Add route to route-utils.ts
export const USER_PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/orders',
  '/track',
  '/billing',
  '/notifications',
  '/your-new-route' // Add your route here
];

// Or for admin routes:
export const ADMIN_ROUTES = [
  '/admin',
  '/admin/your-admin-route' // Add your admin route here
];
```

---

## 📱 **Phone Number Authentication**

### **1. Send OTP**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { phoneNumber } = useAuth();

const handleSendOTP = async (phone) => {
  const result = await phoneNumber.sendOtp({
    phoneNumber: phone
  });
  
  if (result.error) {
    console.error('Failed to send OTP:', result.error);
  } else {
    console.log('OTP sent successfully');
  }
};
```

### **2. Verify OTP**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { phoneNumber } = useAuth();

const handleVerifyOTP = async (phone, code) => {
  const result = await phoneNumber.verifyOtp({
    phoneNumber: phone,
    otp: code
  });
  
  if (result.error) {
    console.error('OTP verification failed:', result.error);
  } else {
    console.log('Phone verified successfully');
  }
};
```

---

## 🎨 **UI Components**

### **1. Protected Component**
```typescript
// components/ProtectedComponent.tsx
import { useAuth } from '@/lib/auth/auth-provider';

export function ProtectedComponent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>Please sign in to access this content</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name || user.email}!</h1>
      <p>This content is only visible to authenticated users.</p>
    </div>
  );
}
```

### **2. Admin-Only Component**
```typescript
// components/AdminComponent.tsx
import { useAuth } from '@/lib/auth/auth-provider';

export function AdminComponent() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }
  
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>This content is only visible to admin users.</p>
    </div>
  );
}
```

### **3. Conditional Rendering**
```typescript
// components/Navigation.tsx
import { useAuth } from '@/lib/auth/auth-provider';
import Link from 'next/link';

export function Navigation() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  return (
    <nav>
      <Link href="/">Home</Link>
      
      {user ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          {isAdmin && <Link href="/admin">Admin Panel</Link>}
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <>
          <Link href="/signin">Sign In</Link>
          <Link href="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

---

## 🔧 **Admin Functions**

### **1. Get All Users (Admin Only)**
```typescript
// In your admin component
import { useAuth } from '@/lib/auth/auth-provider';

const { admin } = useAuth();

const fetchUsers = async () => {
  const result = await admin.listUsers();
  
  if (result.error) {
    console.error('Failed to fetch users:', result.error);
  } else {
    console.log('Users:', result.data);
  }
};
```

### **2. Create User (Admin Only)**
```typescript
// In your admin component
import { useAuth } from '@/lib/auth/auth-provider';

const { admin } = useAuth();

const createUser = async (userData) => {
  const result = await admin.createUser({
    email: userData.email,
    password: userData.password,
    name: userData.name,
    role: userData.role
  });
  
  if (result.error) {
    console.error('Failed to create user:', result.error);
  } else {
    console.log('User created:', result.data);
  }
};
```

### **3. Update User Role (Admin Only)**
```typescript
// In your admin component
import { useAuth } from '@/lib/auth/auth-provider';

const { admin } = useAuth();

const updateUserRole = async (userId, newRole) => {
  const result = await admin.updateUser(userId, {
    role: newRole
  });
  
  if (result.error) {
    console.error('Failed to update user role:', result.error);
  } else {
    console.log('User role updated:', result.data);
  }
};
```

---

## 🚨 **Error Handling**

### **1. Handle Auth Errors**
```typescript
// In your component
import { useAuth } from '@/lib/auth/auth-provider';

const { signIn } = useAuth();

const handleSignIn = async (data) => {
  try {
    const result = await signIn.email(data);
    
    if (result.error) {
      // Handle specific errors
      switch (result.error.code) {
        case 'INVALID_CREDENTIALS':
          setError('Invalid email or password');
          break;
        case 'USER_NOT_FOUND':
          setError('No account found with this email');
          break;
        case 'SESSION_EXPIRED':
          setError('Your session has expired. Please sign in again');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    } else {
      // Success
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    setError('An unexpected error occurred');
  }
};
```

### **2. Handle Network Errors**
```typescript
// The auth client has built-in retry logic
// But you can also handle network errors manually

const handleNetworkError = (error) => {
  if (error.message.includes('NetworkError')) {
    setError('Network error. Please check your connection.');
  } else if (error.message.includes('timeout')) {
    setError('Request timeout. Please try again.');
  } else {
    setError('An error occurred. Please try again.');
  }
};
```

---

## 🧪 **Testing**

### **1. Manual Testing**
```bash
# 1. Test unauthenticated access
curl -i http://localhost:3000/dashboard
# Expected: 302 redirect to /signin

# 2. Test admin access with regular user
# - Sign in as regular user
# - Navigate to /admin
# Expected: Redirect to /unauthorized

# 3. Test session expiration
# - Sign in
# - Wait for session to expire (or manually clear cookies)
# - Try to access protected route
# Expected: Redirect to /signin
```

### **2. Using the Test User**
```bash
# Create a test admin user through the API or database
# Then test admin functionality
```

---

## 🔄 **Common Use Cases**

### **1. Add New Protected Route**
```typescript
// 1. Add route to route-utils.ts
export const USER_PROTECTED_ROUTES = [
  // ... existing routes
  '/my-new-route'
];

// 2. Create the page
// src/app/my-new-route/page.tsx
export default function MyNewRoute() {
  // This page is now automatically protected
  return <div>My New Protected Route</div>;
}
```

### **2. Add New Admin Route**
```typescript
// 1. Add route to route-utils.ts
export const ADMIN_ROUTES = [
  '/admin',
  '/admin/my-admin-feature'
];

// 2. Create the page
// src/app/admin/my-admin-feature/page.tsx
export default function MyAdminFeature() {
  // This page is now automatically protected for admins only
  return <div>My Admin Feature</div>;
}
```

### **3. Check Permissions in Components**
```typescript
// Use the permission utilities
import { isAdmin, canManageUsers } from '@/lib/auth/permissions';
import { useAuth } from '@/lib/auth/auth-provider';

export function MyComponent() {
  const { user } = useAuth();
  
  if (isAdmin(user)) {
    return <AdminContent />;
  }
  
  if (canManageUsers(user)) {
    return <UserManagementContent />;
  }
  
  return <RegularUserContent />;
}
```

---

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **Session not persisting**: Check if cookies are enabled
2. **Redirect loops**: Verify route configuration in route-utils.ts
3. **Permission denied**: Check user role and permissions
4. **Network errors**: Verify environment variables and server connectivity

### **Debug Mode**
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check browser console for detailed auth logs
# Check server console for middleware logs
```

---

## 🎯 **Quick Reference**

### **Essential Imports**
```typescript
// Auth hook
import { useAuth } from '@/lib/auth/auth-provider';

// Permission utilities
import { isAdmin, canManageUsers } from '@/lib/auth/permissions';

// Server-side auth
import { auth } from '@/lib/auth/auth';
```

### **Common Patterns**
```typescript
// Check if user is authenticated
const { user, loading } = useAuth();
if (loading) return <Loading />;
if (!user) return <SignInPrompt />;

// Check if user is admin
const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

// Sign out user
const { signOut } = useAuth();
await signOut();
```

---

🎉 **You're all set!** Your Better-Auth implementation is ready to use. Start building your authenticated features with confidence!
