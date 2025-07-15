import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SigninForm from '@/components/auth/signin-form';
import { getClientSession, getRoleBasedRedirectPath } from '@/lib/services/sessionService';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock auth client
jest.mock('@/lib/auth/auth-client', () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
    },
  },
}));

// Mock session service
jest.mock('@/lib/services/sessionService', () => ({
  getClientSession: jest.fn(),
  getRoleBasedRedirectPath: jest.fn((role) => {
    if (role === 'admin' || role === 'super_admin') return '/admin';
    if (role === 'user') return '/dashboard';
    return '/signin';
  }),
}));

describe('SigninForm', () => {
  const mockPush = jest.fn();
  const mockSignIn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (authClient.signIn as any) = { email: mockSignIn };
    (getClientSession as jest.Mock).mockResolvedValue(null);
  });

  it('renders the signin form', () => {
    render(<SigninForm />);
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('handles successful sign in and redirects based on user role', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    (getClientSession as jest.Mock).mockResolvedValueOnce({ 
      user: { role: 'admin' } 
    });
    
    render(<SigninForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Wait for async operations
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(toast.success).toHaveBeenCalledWith('Signed in successfully');
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows error on failed sign in', async () => {
    mockSignIn.mockResolvedValueOnce({ 
      error: { message: 'Invalid credentials' } 
    });
    
    render(<SigninForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'wrongpassword' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Wait for error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
