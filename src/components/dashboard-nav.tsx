/** @format */
'use client';
import { LogoutButton } from '@/components/auth/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}
export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <nav className="dashboard-nav">
      <div className="dashboard-nav-header">
        <h1>Dashboard</h1>
        <div className="dashboard-user-info">
          <span>Welcome, {user?.name || user?.email}</span>
          <ThemeToggle />
          <a href="/profile" className="text-primary hover:underline">
            Profile
          </a>
          {user?.role === 'admin' && (
            <>
              <span className="text-muted-foreground">|</span>
              <a href="/admin" className="admin-link">
                Admin Panel
              </a>
            </>
          )}
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
