/** @format */
'use client';
import { UserAnalyticsCard } from './user-analytics-card';
import { UsersByCountryChart } from './users-by-country-chart';
import { UsersByRoleChart } from './users-by-role-chart';
import { Badge } from '@/components/ui/badge';
import { IconWorld } from '@tabler/icons-react';
interface CountryFilteredAnalyticsProps {
  country?: string;
  userRole: string;
}
export function CountryFilteredAnalytics({ country, userRole }: CountryFilteredAnalyticsProps) {
  const isCountryFiltered = country && userRole !== 'super_admin';
  return (
    <div className="space-y-6">
      {/* Country Filter Indicator */}
      {isCountryFiltered && (
        <div className="flex items-center gap-2 mb-4">
          <IconWorld className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-600">Viewing analytics for:</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {country}
          </Badge>
        </div>
      )}
      {/* Grid Layout for Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Card - Takes 2 columns */}
        <div className="lg:col-span-2">
          <UserAnalyticsCard country={country} />
        </div>
        {/* Charts Section - Each takes 1 column */}
        <div className="lg:col-span-1">
          <UsersByCountryChart country={country} />
        </div>
        <div className="lg:col-span-1">
          <UsersByRoleChart country={country} />
        </div>
      </div>
    </div>
  );
}
