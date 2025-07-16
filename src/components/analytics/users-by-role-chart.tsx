/** @format */
'use client';
import { useEffect } from 'react';
import { useAnalyticsStore } from '@/lib/store/analytics-store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconShield, IconUser, IconUserCheck, IconCrown } from '@tabler/icons-react';
interface UsersByRoleChartProps {
  country?: string;
}
const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return IconCrown;
    case 'admin':
      return IconShield;
    case 'user':
    default:
      return IconUser;
  }
};
const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-700';
    case 'admin':
      return 'bg-blue-100 text-blue-700';
    case 'user':
    default:
      return 'bg-green-100 text-green-700';
  }
};
const formatRoleName = (role: string) => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
export function UsersByRoleChart({ country }: UsersByRoleChartProps) {
  const { usersByRole, fetchUsersByRole, isLoading } = useAnalyticsStore();
  useEffect(() => {
    fetchUsersByRole(country);
  }, [fetchUsersByRole, country]);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconShield className="h-4 w-4" />
          Users by Role
        </CardTitle>
        <CardDescription>Distribution of user roles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usersByRole.map((roleData) => {
            const RoleIcon = getRoleIcon(roleData.role);
            const colorClass = getRoleColor(roleData.role);
            const isHighestRole = roleData.role.toLowerCase() === 'super_admin';
            return (
              <div key={roleData.role} className="p-4 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${colorClass}`}>
                    <RoleIcon className="h-5 w-5" />
                  </div>
                  {isHighestRole && (
                    <Badge variant="secondary" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {roleData.users.toLocaleString()}
                  </div>
                  <div className="font-medium text-sm mb-1">
                    {formatRoleName(roleData.role)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {roleData.percentage}% of total
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <IconUserCheck className="h-3 w-3" />
                    {roleData.role.toLowerCase() === 'user' ? 'Regular users' : 
                     roleData.role.toLowerCase() === 'admin' ? 'Administrative access' : 'Full system access'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {usersByRole.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconShield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No role data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
