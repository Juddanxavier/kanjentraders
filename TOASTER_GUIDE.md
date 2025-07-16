# Toast Notification System Guide

## Overview

Your parcel tracking application now has a comprehensive toast notification system using **Sonner** that provides instant feedback for all user actions.

## ✅ **Current Setup**

### 1. **Main Layout** (`src/app/layout.tsx`)
```tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. **Toast Types Available**
- `toast.success()` - Green success messages
- `toast.error()` - Red error messages
- `toast.warning()` - Orange warning messages
- `toast.info()` - Blue info messages
- `toast.loading()` - Loading state with spinner

### 3. **Current Implementations**

**✅ Authentication:**
- Sign in success/error
- Sign up success/error
- Sign out confirmation

**✅ Lead Management:**
- Create lead success/error
- Edit lead success/error
- Delete lead success/error
- Bulk actions success/error

**✅ User Management:**
- User creation success/error
- User editing success/error
- User deletion success/error
- Role changes success/error

**✅ Notification System:**
- Real-time notifications appear as toasts
- Different priority levels (success, info, warning, error)
- Action buttons in toasts for navigation

## 🔧 **How to Use Toasts**

### Basic Usage
```tsx
import { toast } from 'sonner';

// Success toast
toast.success('Operation completed successfully!');

// Error toast
toast.error('Something went wrong. Please try again.');

// Warning toast
toast.warning('Please check your input.');

// Info toast
toast.info('New feature available!');

// Loading toast
const loadingToast = toast.loading('Processing...');
// Later dismiss it
toast.dismiss(loadingToast);
```

### Advanced Usage
```tsx
// Toast with action button
toast.success('Lead created successfully!', {
  action: {
    label: 'View',
    onClick: () => router.push('/leads/123')
  }
});

// Toast with custom duration
toast.success('Saved!', {
  duration: 2000 // 2 seconds
});

// Toast with description
toast.error('Failed to save', {
  description: 'Please check your network connection and try again.'
});

// Custom toast with rich content
toast.custom((t) => (
  <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-lg">
    <CheckCircle className="h-5 w-5 text-green-500" />
    <div>
      <p className="font-medium">Success!</p>
      <p className="text-sm text-gray-600">Your data has been saved</p>
    </div>
  </div>
));
```

## 📍 **Adding Toasts to New Components**

### 1. **Import Sonner**
```tsx
import { toast } from 'sonner';
```

### 2. **Add to API Calls**
```tsx
const handleSubmit = async (data) => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    toast.success('Data saved successfully!');
  } catch (error) {
    toast.error('Failed to save data. Please try again.');
    console.error('Error:', error);
  }
};
```

### 3. **Add to Form Submissions**
```tsx
const onSubmit = async (data) => {
  const loadingToast = toast.loading('Creating...');
  
  try {
    await createItem(data);
    toast.dismiss(loadingToast);
    toast.success('Item created successfully!');
    onClose();
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error('Failed to create item. Please try again.');
  }
};
```

### 4. **Add to Delete Actions**
```tsx
const handleDelete = async (id) => {
  try {
    await deleteItem(id);
    toast.success('Item deleted successfully!');
  } catch (error) {
    toast.error('Failed to delete item. Please try again.');
  }
};
```

## 🎨 **Customization Options**

### Position
```tsx
<Toaster position="top-right" />     // Default
<Toaster position="top-center" />
<Toaster position="top-left" />
<Toaster position="bottom-right" />
<Toaster position="bottom-center" />
<Toaster position="bottom-left" />
```

### Theme
```tsx
<Toaster 
  theme="light"        // light, dark, system
  richColors           // Enable rich colors
  closeButton          // Show close button
  expand               // Expand on hover
  visibleToasts={5}    // Max visible toasts
  toastOptions={{
    duration: 4000,    // Default duration
    style: {
      background: 'white',
      color: 'black',
    },
  }}
/>
```

## 🔄 **Integration with Real-time Notifications**

The notification system automatically shows toasts for real-time notifications:

```tsx
// In useNotifications.ts
switch (data.priority) {
  case 3: // Urgent
    toast.error(data.title, {
      description: data.message,
      action: data.actionUrl ? {
        label: 'View',
        onClick: () => window.location.href = data.actionUrl,
      } : undefined,
    });
    break;
  case 2: // High
    toast.warning(data.title, { description: data.message });
    break;
  case 1: // Medium
    toast.info(data.title, { description: data.message });
    break;
  default: // Low
    toast.success(data.title, { description: data.message });
    break;
}
```

## 🚀 **Best Practices**

### 1. **Consistent Messaging**
```tsx
// Good
toast.success('Lead created successfully!');
toast.error('Failed to create lead. Please try again.');

// Bad
toast.success('Lead created!!!');
toast.error('ERROR: Cannot create lead');
```

### 2. **Provide Context**
```tsx
// Good
toast.error('Failed to save changes. Please check your network connection.');

// Bad
toast.error('Error occurred');
```

### 3. **Use Loading States**
```tsx
const handleSubmit = async (data) => {
  const loadingToast = toast.loading('Saving changes...');
  
  try {
    await saveData(data);
    toast.dismiss(loadingToast);
    toast.success('Changes saved successfully!');
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error('Failed to save changes. Please try again.');
  }
};
```

### 4. **Add Action Buttons When Useful**
```tsx
toast.success('Lead created successfully!', {
  action: {
    label: 'View Lead',
    onClick: () => router.push(`/leads/${leadId}`)
  }
});
```

## 🔧 **Common Patterns**

### API Error Handling
```tsx
const handleApiCall = async () => {
  try {
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    toast.success('Operation completed successfully!');
    return data;
  } catch (error) {
    toast.error(error.message || 'An unexpected error occurred');
    throw error;
  }
};
```

### Form Validation
```tsx
const onSubmit = async (data) => {
  // Client-side validation
  if (!data.email) {
    toast.error('Email is required');
    return;
  }
  
  // Server-side validation
  try {
    await submitForm(data);
    toast.success('Form submitted successfully!');
  } catch (error) {
    if (error.status === 422) {
      toast.error('Please check your input and try again');
    } else {
      toast.error('Failed to submit form. Please try again.');
    }
  }
};
```

### Bulk Operations
```tsx
const handleBulkAction = async (selectedIds) => {
  const count = selectedIds.length;
  const loadingToast = toast.loading(`Processing ${count} items...`);
  
  try {
    await bulkAction(selectedIds);
    toast.dismiss(loadingToast);
    toast.success(`Successfully processed ${count} items`);
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error(`Failed to process ${count} items. Please try again.`);
  }
};
```

## 📱 **Mobile Considerations**

The toaster is fully responsive and works well on mobile devices:

- Position automatically adjusts on smaller screens
- Touch-friendly close buttons
- Appropriate sizing for mobile viewports
- Swipe to dismiss functionality

## 🎯 **Testing Toasts**

### Manual Testing
```tsx
// Add temporary buttons for testing
const TestToasts = () => (
  <div className="flex gap-2 p-4">
    <button onClick={() => toast.success('Success!')}>Success</button>
    <button onClick={() => toast.error('Error!')}>Error</button>
    <button onClick={() => toast.warning('Warning!')}>Warning</button>
    <button onClick={() => toast.info('Info!')}>Info</button>
  </div>
);
```

### Automated Testing
```tsx
// In your tests
import { toast } from 'sonner';

test('shows success toast on form submission', async () => {
  const mockToast = jest.spyOn(toast, 'success');
  
  // ... perform action
  
  expect(mockToast).toHaveBeenCalledWith('Form submitted successfully!');
});
```

## 🔍 **Troubleshooting**

### Common Issues

1. **Toasts not showing**
   - Check that `<Toaster />` is in your layout
   - Verify import: `import { toast } from 'sonner'`

2. **Styling issues**
   - Check CSS conflicts
   - Verify theme settings
   - Check z-index values

3. **Multiple toasts**
   - Use `toast.dismiss()` to clear existing toasts
   - Set appropriate `visibleToasts` limit

### Debug Mode
```tsx
<Toaster 
  position="top-right"
  richColors
  expand
  visibleToasts={10}
  toastOptions={{
    duration: 10000, // Longer duration for debugging
  }}
/>
```

## 📚 **Further Reading**

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [React Hot Toast (alternative)](https://react-hot-toast.com/)
- [Toast UX Best Practices](https://uxplanet.org/toast-notification-best-practices-9c63c6b0bbf9)

The toast system is now fully integrated and ready to provide excellent user feedback throughout your application! 🎉
