/** @format */
'use client';
import { useEffect } from 'react';
import { useAnalyticsStore } from '@/lib/store/analytics-store';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconUsers, IconUserCheck, IconUserPlus, IconTrendingUp } from '@tabler/icons-react';
interface UserAnalyticsCardProps {
  country?: string;
}
export function UserAnalyticsCard({ country }: UserAnalyticsCardProps) {
  const { userMetrics, fetchAllAnalytics, isLoading } = useAnalyticsStore();
  useEffect(() => {
    fetchAllAnalytics(country);
  }, [fetchAllAnalytics, country]);
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></CardDescription>
              <CardTitle className="animate-pulse h-8 bg-gray-200 rounded w-3/4"></CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }
  const growthRate = userMetrics.newUsers > 0 ? ((userMetrics.newUsers / (userMetrics.totalUsers - userMetrics.newUsers)) * 100) : 0;
  const activityTrend = userMetrics.percentageActive >= 50 ? 'up' : 'down';
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card p-2">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            {userMetrics.totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="size-3" />
              All Users
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total registered users <IconUsers className="size-3" />
          </div>
          <div className="text-muted-foreground">
            All time registration count
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {userMetrics.activeUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUserCheck className="size-4" />
              {userMetrics.percentageActive.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activityTrend === 'up' ? 'Strong engagement' : 'Needs attention'} <IconUserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            User activity this period
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {userMetrics.newUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {growthRate >= 10 ? <IconTrendingUp className="size-4" /> : <IconUserPlus className="size-4" />}
              +{growthRate.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {growthRate >= 10 ? 'Growing rapidly' : 'Steady growth'} <IconUserPlus className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Recent registrations
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Activity Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {userMetrics.percentageActive.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {activityTrend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingUp className="size-4 rotate-180" />}
              {activityTrend === 'up' ? 'High' : 'Low'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activityTrend === 'up' ? 'Excellent engagement' : 'Room for improvement'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            User engagement metrics
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
