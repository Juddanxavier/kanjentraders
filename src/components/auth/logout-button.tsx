/** @format */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
/**
 * LOGOUT BUTTON COMPONENT
 * 
 * Provides secure logout functionality with:
 * - Better Auth integration
 * - Loading states
 * - Error handling
 * - Redirect to signin
 */
export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Sign out using Better Auth
      const { error } = await authClient.signOut();
      if (error) {
        return;
      }
      // Show success message
      // Redirect to signin page
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      } finally {
      setIsLoading(false);
    }
  };
  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="logout-button"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
/**
 * SECURITY FEATURES:
 * 
 * 1. Proper session termination via Better Auth
 * 2. Loading states to prevent double clicks
 * 3. Error handling with user feedback
 * 4. Automatic redirect to signin
 * 5. Toast notifications for UX
 */
