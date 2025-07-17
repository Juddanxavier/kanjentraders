/** @format */
'use client'

import { AuthGuard } from '@/components/auth/auth-guard';
import { useSession, signOut } from 'next-auth/react';
import { UserAnalyticsCard } from '@/components/analytics/user-analytics-card';
import { Button } from '@/components/ui/button';

/**
 * USER DASHBOARD PAGE
 * 
 * This page shows user-specific information and actions
 * Security is handled by the AuthGuard component
 */
export default function DashboardPage() {
  const { data: session } = useSession();
  
  if (!session) {
    return null;
  }
  
  const { user } = session;
  
  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };
  
  return (
    <AuthGuard>
      <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1>Welcome to Your Dashboard</h1>
            <p>Manage your account and track your packages</p>
          </div>
          <div className="dashboard-header-actions">
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="dashboard-grid">
        {/* User Profile Card */}
        <div className="dashboard-card">
          <h2>Profile Information</h2>
          <div className="profile-info">
            <p><strong>Name:</strong> {user.name || 'Not set'}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>Account type:</strong> {user.role || 'User'}</p>
          </div>
          <button className="btn-primary">Edit Profile</button>
        </div>
        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="btn-secondary">Track Package</button>
            <button className="btn-secondary">View Orders</button>
            <button className="btn-secondary">Settings</button>
          </div>
        </div>
        {/* Recent Activity */}
        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <p>No recent activity</p>
          </div>
        </div>
        {/* User Analytics (if user is admin) */}
        {user.role === 'admin' && (
          <div className="dashboard-card col-span-full">
            <UserAnalyticsCard />
          </div>
        )}
        {/* Admin Access (if user is admin) */}
        {user.role === 'admin' && (
          <div className="dashboard-card admin-card">
            <h2>Admin Access</h2>
            <p>You have administrative privileges</p>
            <a href="/admin" className="btn-admin">
              Go to Admin Panel
            </a>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
/**
 * SECURITY NOTES:
 * 
 * 1. Session is already validated in layout
 * 2. User data is safely displayed
 * 3. Admin access is conditionally shown
 * 4. No sensitive operations without additional checks
 */
