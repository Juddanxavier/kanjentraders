/** @format */

'use client';

import { UserAnalyticsCard } from './user-analytics-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconActivity, IconTrendingUp, IconUserCheck } from '@tabler/icons-react';

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Analytics Card */}
        <UserAnalyticsCard />
        
        {/* User Activity Trend Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconActivity className="h-5 w-5" />
              User Activity Trend
            </CardTitle>
            <CardDescription>Daily active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-gray-500">
              Chart placeholder - integrate with recharts
            </div>
          </CardContent>
        </Card>
        
        {/* User Growth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>New user registrations by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-gray-500">
              Chart placeholder - integrate with recharts
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
            <CardDescription>User distribution by location and role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Users by Country</span>
                <span className="text-sm text-gray-500">Count</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">United States</span>
                  <span className="text-sm font-medium">1,250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Canada</span>
                  <span className="text-sm font-medium">875</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">United Kingdom</span>
                  <span className="text-sm font-medium">643</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Login frequency and session duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Session Duration</span>
                <span className="text-sm font-medium">12m 34s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily Active Users</span>
                <span className="text-sm font-medium">456</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Active Users</span>
                <span className="text-sm font-medium">2,341</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-sm font-medium">23.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
