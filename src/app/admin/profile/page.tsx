/** @format */
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/admin/profile-form';
import { PasswordChangeForm } from '@/components/admin/password-change-form';
import { SessionsList } from '@/components/admin/sessions-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSiteHeader } from '@/components/admin-site-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
export default async function AdminProfilePage() {
  // Get session for admin info
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // This should never happen due to middleware validation
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    redirect('/dashboard');
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminSiteHeader user={{ name: session.user.name, email: session.user.email, image: session.user.image }} />
        <div className="flex flex-1 flex-col">
          <div className="p-8">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account settings and preferences
              </p>
            </div>
            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Profile Information Card */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm user={session.user} />
                </CardContent>
              </Card>
              {/* Password & Security Card */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordChangeForm />
                </CardContent>
              </Card>
              {/* Two-Factor Authentication Card */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication is not yet available. This feature will be added soon to enhance your account security.
                      </p>
                    </div>
                    <button 
                      disabled
                      className="w-full rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                </CardContent>
              </Card>
              {/* Active Sessions Card - Full Width */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Monitor and manage your active sessions across devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionsList currentSessionId={session.session?.id} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
