/** @format */
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
const pathMap: Record<string, string> = {
  '/admin': 'Admin',
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/leads': 'Leads',
  '/admin/parcels': 'Parcels',
  '/admin/analytics': 'Analytics',
  '/admin/communications': 'Communications',
  '/admin/notifications': 'Notifications',
  '/admin/security': 'Security',
  '/admin/api-keys': 'API Keys',
  '/admin/settings': 'Settings',
  '/admin/help': 'Help',
  '/admin/profile': 'Profile',
};
export function AdminBreadcrumb() {
  const pathname = usePathname();
  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const title = pathMap[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return {
      title,
      path,
      isLast,
    };
  });
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.path}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.path}>{item.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
