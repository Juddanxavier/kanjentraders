/** @format */

'use client';

import { useEffect } from 'react';
import { useAnalyticsStore } from '@/lib/store/analytics-store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconWorld, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface UsersByCountryChartProps {
  country?: string;
}

export function UsersByCountryChart({ country }: UsersByCountryChartProps) {
  const { usersByCountry, fetchUsersByCountry, isLoading } = useAnalyticsStore();

  useEffect(() => {
    fetchUsersByCountry(country);
  }, [fetchUsersByCountry, country]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users by Country</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <IconWorld className="h-4 w-4" />
          Users by Country
        </CardTitle>
        <CardDescription>Geographic distribution of users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {usersByCountry.map((countryData, index) => {
            const isTopCountry = index === 0;
            const isGrowingMarket = countryData.percentage >= 20;
            
            return (
              <div key={countryData.country} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <IconWorld className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{countryData.country}</span>
                      {isTopCountry && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {countryData.percentage}% of total users
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {countryData.users.toLocaleString()}
                    </span>
                    {isGrowingMarket ? (
                      <IconTrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconTrendingDown className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isGrowingMarket ? 'Growing market' : 'Emerging market'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {usersByCountry.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconWorld className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No country data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
