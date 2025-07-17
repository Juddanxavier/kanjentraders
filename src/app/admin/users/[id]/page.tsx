/** @format */
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';
import { prisma } from '@/lib/prisma';
import { canManageUsers, getCountryFilter } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
import { ViewUserTabs } from '@/components/admin/view-user-tabs';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminSiteHeader } from '@/components/admin-site-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { 
  IconArrowLeft, 
  IconUser, 
  IconMail, 
  IconCalendar,
  IconMapPin,
  IconShieldCheck,
  IconBan,
  IconClock,
  IconActivity
} from '@tabler/icons-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ViewUserPage({ params }: PageProps) {
  const { id } = await params;

  try {
    // Get session
    const session = await getSession();
    const currentUser = session?.user as AuthUser | null;

    // Check permissions
    if (!currentUser || !canManageUsers(currentUser)) {
      notFound();
    }

    // Get country filter based on user role
    const countryFilter = getCountryFilter(currentUser);

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { 
        id,
        ...(countryFilter ? { country: countryFilter } : {})
      },
      include: {
        sessions: {
          where: {
            expires: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            sessionToken: true,
            expires: true,
          },
        },
        assignedLeads: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            shipment: {
              select: {
                id: true,
                whiteLabelTrackingId: true,
                trackingNumber: true,
                carrier: true,
                status: true,
                estimatedDelivery: true,
                actualDelivery: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdLeads: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            shipment: {
              select: {
                id: true,
                whiteLabelTrackingId: true,
                trackingNumber: true,
                carrier: true,
                status: true,
                estimatedDelivery: true,
                actualDelivery: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      notFound();
    }

    // Get shipments for leads created by this user
    const createdLeadShipments = await prisma.shipment.findMany({
      where: {
        lead: {
          createdById: id,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            destination: true,
            origin: true,
            status: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get shipments for leads assigned to this user
    const assignedLeadShipments = await prisma.shipment.findMany({
      where: {
        lead: {
          assignedToId: id,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            destination: true,
            origin: true,
            status: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Helper function to get user initials
    const getUserInitials = (name?: string | null, email?: string) => {
      if (name) {
        return name
          .split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      }
      return email?.slice(0, 2).toUpperCase() || 'U';
    };

    // Helper function to get role color
    const getRoleColor = (role: string) => {
      switch (role) {
        case 'super_admin': return 'bg-red-100 text-red-800 border-red-200';
        case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'user': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    // Helper function to get status color
    const getStatusColor = (banned: boolean, emailVerified: boolean) => {
      if (banned) return 'bg-red-100 text-red-800 border-red-200';
      if (!emailVerified) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStatusText = (banned: boolean, emailVerified: boolean) => {
      if (banned) return 'Banned';
      if (!emailVerified) return 'Unverified';
      return 'Active';
    };

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
          <AdminSiteHeader user={currentUser} />
          <div className="flex flex-1 flex-col">
            <div className="p-8 space-y-8">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <IconArrowLeft className="h-4 w-4" />
                    Back to Users
                  </Button>
                </Link>
              </div>

              {/* User Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="text-2xl">
                        {getUserInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-3xl">{user.name || 'Unnamed User'}</CardTitle>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(user.banned, user.emailVerified !== null)}>
                          {getStatusText(user.banned, user.emailVerified !== null)}
                        </Badge>
                      </div>
                      <CardDescription className="text-lg mb-4">
                        {user.email}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconCalendar className="h-4 w-4" />
                          <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconActivity className="h-4 w-4" />
                          <span>{user.sessions.length} active session{user.sessions.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconMail className="h-5 w-5 text-blue-600" />
                      Contact Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Email Status</p>
                      <p className="text-sm text-muted-foreground">
                        {user.emailVerified ? '✓ Verified' : '⚠ Not Verified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {user.phoneNumber || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Country</p>
                      <p className="text-sm text-muted-foreground">
                        {user.country || 'Not specified'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Overview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconActivity className="h-5 w-5 text-green-600" />
                      Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Created Leads</p>
                      <p className="text-2xl font-bold text-green-600">{user.createdLeads.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Assigned Leads</p>
                      <p className="text-2xl font-bold text-blue-600">{user.assignedLeads.length}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Security */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconShieldCheck className="h-5 w-5 text-purple-600" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Active Sessions</p>
                      <p className="text-2xl font-bold text-purple-600">{user.sessions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone Verified</p>
                      <p className="text-sm text-muted-foreground">
                        {user.phoneNumberVerified ? '✓ Yes' : '✗ No'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconUser className="h-5 w-5 text-orange-600" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                      <Badge className={getStatusColor(user.banned, user.emailVerified !== null)}>
                        {getStatusText(user.banned, user.emailVerified !== null)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ban Information Card */}
              {user.banned && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                      <IconBan className="h-5 w-5" />
                      Account Banned
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-red-800">Ban Expires</p>
                      <p className="text-sm text-red-700">
                        {user.banExpires ? format(new Date(user.banExpires), 'MMM d, yyyy') : 'Permanent'}
                      </p>
                    </div>
                    {user.banReason && (
                      <div>
                        <p className="text-sm font-medium text-red-800">Reason</p>
                        <p className="text-sm text-red-700">{user.banReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Detailed Information */}
              <ViewUserTabs 
                user={user} 
                currentUser={currentUser} 
                createdLeadShipments={createdLeadShipments} 
                assignedLeadShipments={assignedLeadShipments} 
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    notFound();
  }
}
